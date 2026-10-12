-- TAJO TAP V4.1 — ativação resiliente + lotes de produção
-- Execute APÓS 001, 002 e 003.
-- Não apaga clientes, plaquinhas, destinos, vendedores ou analytics existentes.
-- Esta migration usa NOVOS nomes de RPC para evitar conflitos de contrato com versões antigas.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Compatibilidade estrutural de ativação
-- ---------------------------------------------------------------------------
alter table public.tap_plates add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.tap_plates add column if not exists setup_status text;
alter table public.tap_plates add column if not exists configuration_locked boolean;
alter table public.tap_plates add column if not exists configured_at timestamptz;
alter table public.tap_plates add column if not exists configured_by uuid references auth.users(id) on delete set null;
alter table public.tap_plates add column if not exists claimed_at timestamptz;

update public.tap_plates
set setup_status = case
  when status = 'active' and current_destination_id is not null then 'completed'
  else 'pending'
end
where setup_status is null;

update public.tap_plates
set configuration_locked = (setup_status = 'completed')
where configuration_locked is null;

alter table public.tap_plates alter column setup_status set default 'pending';
alter table public.tap_plates alter column setup_status set not null;
alter table public.tap_plates alter column configuration_locked set default false;
alter table public.tap_plates alter column configuration_locked set not null;

alter table public.tap_plates drop constraint if exists tap_plates_setup_status_check;
alter table public.tap_plates
  add constraint tap_plates_setup_status_check
  check (setup_status in ('pending','completed'));

alter table public.tap_plate_activation_codes add column if not exists failed_attempts integer;
alter table public.tap_plate_activation_codes add column if not exists last_failed_at timestamptz;
alter table public.tap_plate_activation_codes add column if not exists locked_until timestamptz;

update public.tap_plate_activation_codes set failed_attempts = 0 where failed_attempts is null;
alter table public.tap_plate_activation_codes alter column failed_attempts set default 0;
alter table public.tap_plate_activation_codes alter column failed_attempts set not null;

alter table public.tap_plate_activation_codes drop constraint if exists tap_activation_failed_attempts_check;
alter table public.tap_plate_activation_codes
  add constraint tap_activation_failed_attempts_check
  check (failed_attempts between 0 and 50);

-- ---------------------------------------------------------------------------
-- Produção em lote
-- ---------------------------------------------------------------------------
create table if not exists public.tap_plate_batches (
  id uuid primary key default gen_random_uuid(),
  batch_code text not null unique check (batch_code ~ '^LOT-[A-Z0-9-]{6,40}$'),
  label text not null check (char_length(label) between 2 and 120),
  quantity integer not null check (quantity between 1 and 100),
  status text not null default 'ready' check (status in ('ready','sent_to_print','completed','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tap_plates add column if not exists batch_id uuid references public.tap_plate_batches(id) on delete set null;
alter table public.tap_plates add column if not exists batch_position integer;

create index if not exists tap_plate_batches_created_at_idx on public.tap_plate_batches(created_at desc);
create index if not exists tap_plates_batch_id_idx on public.tap_plates(batch_id, batch_position);

-- ---------------------------------------------------------------------------
-- RPC V4: validar PIN. retry_after permanece TIMESTAMPTZ para contrato estável.
-- ---------------------------------------------------------------------------
drop function if exists public.tap_validate_activation_pin_v4(text, text);
create function public.tap_validate_activation_pin_v4(
  p_plate_code text,
  p_pin text
)
returns table(result_code text, retry_after timestamptz)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_plate public.tap_plates%rowtype;
  v_activation public.tap_plate_activation_codes%rowtype;
  v_attempts integer;
  v_lock_until timestamptz;
begin
  select p.* into v_plate
  from public.tap_plates p
  where p.code = upper(trim(coalesce(p_plate_code, '')))
  for update;

  if not found then
    return query select 'PLATE_NOT_FOUND'::text, null::timestamptz;
    return;
  end if;

  if v_plate.configuration_locked
     or v_plate.setup_status = 'completed'
     or v_plate.owner_user_id is not null
     or v_plate.status = 'active' then
    return query select 'ALREADY_CONFIGURED'::text, null::timestamptz;
    return;
  end if;

  if v_plate.status not in ('inventory','unconfigured') then
    return query select 'PLATE_UNAVAILABLE'::text, null::timestamptz;
    return;
  end if;

  select a.* into v_activation
  from public.tap_plate_activation_codes a
  where a.plate_id = v_plate.id
  for update;

  if not found then
    return query select 'PIN_NOT_AVAILABLE'::text, null::timestamptz;
    return;
  end if;

  if v_activation.consumed_at is not null then
    return query select 'PIN_USED'::text, null::timestamptz;
    return;
  end if;

  if v_activation.expires_at is not null and v_activation.expires_at <= now() then
    return query select 'PIN_EXPIRED'::text, null::timestamptz;
    return;
  end if;

  if v_activation.locked_until is not null and v_activation.locked_until > now() then
    return query select 'PIN_LOCKED'::text, v_activation.locked_until;
    return;
  end if;

  if p_pin is null
     or p_pin !~ '^[0-9]{6}$'
     or encode(digest(p_pin, 'sha256'), 'hex') is distinct from v_activation.code_hash then
    v_attempts := least(coalesce(v_activation.failed_attempts, 0) + 1, 50);
    v_lock_until := case when v_attempts >= 5 then now() + interval '15 minutes' else null end;

    update public.tap_plate_activation_codes
    set failed_attempts = v_attempts,
        last_failed_at = now(),
        locked_until = v_lock_until
    where plate_id = v_plate.id;

    if v_lock_until is not null then
      return query select 'PIN_LOCKED'::text, v_lock_until;
    end if;

    return query select 'PIN_INVALID'::text, null::timestamptz;
    return;
  end if;

  update public.tap_plate_activation_codes
  set failed_attempts = 0,
      last_failed_at = null,
      locked_until = null
  where plate_id = v_plate.id;

  return query select 'PIN_OK'::text, null::timestamptz;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC V4: ativação atômica. Menos pontos frágeis e auditoria best-effort.
-- ---------------------------------------------------------------------------
drop function if exists public.tap_activate_plate_v4(text, text, uuid, text, text, text, text, text, text, text);
create function public.tap_activate_plate_v4(
  p_plate_code text,
  p_pin text,
  p_user uuid,
  p_company_name text,
  p_contact_name text,
  p_phone text,
  p_email text,
  p_type text,
  p_url text,
  p_label text
)
returns table(
  result_code text,
  plate_id uuid,
  client_id uuid,
  destination_id uuid,
  configured_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_plate public.tap_plates%rowtype;
  v_activation public.tap_plate_activation_codes%rowtype;
  v_client_id uuid;
  v_destination_id uuid;
  v_configured_at timestamptz := now();
  v_attempts integer;
  v_lock_until timestamptz;
begin
  if p_user is null or not exists (select 1 from auth.users u where u.id = p_user) then
    return query select 'USER_NOT_FOUND'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if p_type not in ('google','whatsapp','instagram','smart','map','custom') then
    return query select 'TYPE_INVALID'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if p_url is null or p_url !~ '^https://[^[:space:]]+$' then
    return query select 'URL_INVALID'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  select p.* into v_plate
  from public.tap_plates p
  where p.code = upper(trim(coalesce(p_plate_code, '')))
  for update;

  if not found then
    return query select 'PLATE_NOT_FOUND'::text, null::uuid, null::uuid, null::uuid, null::timestamptz;
    return;
  end if;

  if v_plate.configuration_locked
     or v_plate.setup_status = 'completed'
     or v_plate.owner_user_id is not null
     or v_plate.status = 'active' then
    return query select 'ALREADY_CONFIGURED'::text, v_plate.id, v_plate.client_id, v_plate.current_destination_id, v_plate.configured_at;
    return;
  end if;

  if v_plate.status not in ('inventory','unconfigured') then
    return query select 'PLATE_UNAVAILABLE'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  select a.* into v_activation
  from public.tap_plate_activation_codes a
  where a.plate_id = v_plate.id
  for update;

  if not found then
    return query select 'PIN_NOT_AVAILABLE'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if v_activation.consumed_at is not null then
    return query select 'PIN_USED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if v_activation.expires_at is not null and v_activation.expires_at <= now() then
    return query select 'PIN_EXPIRED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if v_activation.locked_until is not null and v_activation.locked_until > now() then
    return query select 'PIN_LOCKED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  if p_pin is null
     or p_pin !~ '^[0-9]{6}$'
     or encode(digest(p_pin, 'sha256'), 'hex') is distinct from v_activation.code_hash then
    v_attempts := least(coalesce(v_activation.failed_attempts, 0) + 1, 50);
    v_lock_until := case when v_attempts >= 5 then now() + interval '15 minutes' else null end;

    update public.tap_plate_activation_codes
    set failed_attempts = v_attempts,
        last_failed_at = now(),
        locked_until = v_lock_until
    where plate_id = v_plate.id;

    if v_lock_until is not null then
      return query select 'PIN_LOCKED'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    end if;

    return query select 'PIN_INVALID'::text, v_plate.id, v_plate.client_id, null::uuid, null::timestamptz;
    return;
  end if;

  v_client_id := v_plate.client_id;

  if v_client_id is null then
    if p_company_name is null or char_length(trim(p_company_name)) < 2 then
      return query select 'COMPANY_REQUIRED'::text, v_plate.id, null::uuid, null::uuid, null::timestamptz;
      return;
    end if;

    insert into public.tap_clients (name, contact_name, phone, email, status, created_by)
    values (
      left(trim(p_company_name), 120),
      nullif(left(trim(coalesce(p_contact_name, '')), 120), ''),
      nullif(left(trim(coalesce(p_phone, '')), 40), ''),
      nullif(left(lower(trim(coalesce(p_email, ''))), 320), ''),
      'active',
      p_user
    )
    returning id into v_client_id;
  else
    update public.tap_clients c
    set contact_name = coalesce(nullif(c.contact_name, ''), nullif(left(trim(coalesce(p_contact_name, '')), 120), '')),
        phone = coalesce(nullif(c.phone, ''), nullif(left(trim(coalesce(p_phone, '')), 40), '')),
        email = coalesce(nullif(c.email, ''), nullif(left(lower(trim(coalesce(p_email, ''))), 320), '')),
        updated_at = now()
    where c.id = v_client_id;
  end if;

  insert into public.tap_client_members (client_id, user_id, role, active)
  values (v_client_id, p_user, 'owner', true)
  on conflict (client_id, user_id)
  do update set role = 'owner', active = true;

  update public.tap_plate_destinations
  set is_active = false
  where plate_id = v_plate.id and is_active = true;

  insert into public.tap_plate_destinations (plate_id, type, label, url, is_active, created_by)
  values (
    v_plate.id,
    p_type,
    left(coalesce(nullif(trim(p_label), ''), 'Destino'), 120),
    p_url,
    true,
    p_user
  )
  returning id into v_destination_id;

  update public.tap_plates
  set client_id = v_client_id,
      owner_user_id = p_user,
      setup_status = 'completed',
      configuration_locked = true,
      configured_at = v_configured_at,
      configured_by = p_user,
      claimed_at = v_configured_at,
      current_destination_id = v_destination_id,
      status = 'active',
      activated_at = coalesce(activated_at, v_configured_at),
      updated_at = v_configured_at
  where id = v_plate.id;

  update public.tap_plate_activation_codes
  set consumed_at = v_configured_at,
      failed_attempts = 0,
      last_failed_at = null,
      locked_until = null
  where plate_id = v_plate.id;

  -- Auditoria não deve impedir a ativação se houver uma inconsistência histórica no log.
  begin
    insert into public.tap_audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    values (
      p_user,
      'plate.self_activation.complete.v4',
      'plate',
      v_plate.id,
      jsonb_build_object('client_id', v_client_id, 'destination_id', v_destination_id, 'type', p_type, 'source', 'atv')
    );
  exception when others then
    null;
  end;

  return query select 'OK'::text, v_plate.id, v_client_id, v_destination_id, v_configured_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privilégios: RPCs apenas pelo backend (service_role / secret key).
-- ---------------------------------------------------------------------------
revoke all on function public.tap_validate_activation_pin_v4(text, text) from public, anon, authenticated;
grant execute on function public.tap_validate_activation_pin_v4(text, text) to service_role;

revoke all on function public.tap_activate_plate_v4(text, text, uuid, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.tap_activate_plate_v4(text, text, uuid, text, text, text, text, text, text, text) to service_role;

revoke all on public.tap_plate_batches from anon, authenticated;
grant select, insert, update, delete on public.tap_plate_batches to service_role;

grant select, insert, update, delete on public.tap_plates to service_role;

-- Verificação rápida ao final da migration.
select
  to_regprocedure('public.tap_validate_activation_pin_v4(text,text)') as validate_pin_v4,
  to_regprocedure('public.tap_activate_plate_v4(text,text,uuid,text,text,text,text,text,text,text)') as activate_plate_v4,
  to_regclass('public.tap_plate_batches') as batches_table;
