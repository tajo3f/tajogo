-- TAJO TAP V3.3 — fluxo de ativação pública única
-- Execute após 001_tajo_tap_backend.sql (V3.2). Pode ser reexecutada com segurança.

alter table public.tap_plates
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists setup_status text not null default 'pending',
  add column if not exists configuration_locked boolean not null default false,
  add column if not exists configured_at timestamptz,
  add column if not exists configured_by uuid references auth.users(id) on delete set null,
  add column if not exists claimed_at timestamptz;

alter table public.tap_plates drop constraint if exists tap_plates_setup_status_check;
alter table public.tap_plates add constraint tap_plates_setup_status_check check (setup_status in ('pending','completed'));
update public.tap_plates set setup_status='completed', configuration_locked=true, configured_at=coalesce(configured_at,activated_at,updated_at) where status='active' and current_destination_id is not null and setup_status='pending';

create index if not exists tap_plates_owner_user_id_idx on public.tap_plates(owner_user_id);
create index if not exists tap_plates_setup_status_idx on public.tap_plates(setup_status, configuration_locked);

alter table public.tap_plate_activation_codes
  add column if not exists failed_attempts integer not null default 0,
  add column if not exists locked_until timestamptz;

-- Consulta segura do PIN. Não consome o código; apenas valida e aplica bloqueio temporário.
create or replace function public.tap_check_activation_pin(p_plate_code text, p_pin text)
returns table(result_code text, retry_after integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plate public.tap_plates%rowtype;
  v_code public.tap_plate_activation_codes%rowtype;
  v_hash text;
  v_attempts integer;
begin
  select * into v_plate from public.tap_plates where code = upper(trim(p_plate_code)) limit 1;
  if not found then return query select 'PLATE_NOT_FOUND'::text, null::integer; return; end if;
  if v_plate.configuration_locked or v_plate.setup_status='completed' or v_plate.owner_user_id is not null or v_plate.status='active' then
    return query select 'ALREADY_CONFIGURED'::text, null::integer; return;
  end if;
  if v_plate.status not in ('inventory','unconfigured') then return query select 'PLATE_UNAVAILABLE'::text, null::integer; return; end if;

  select * into v_code from public.tap_plate_activation_codes where plate_id=v_plate.id for update;
  if not found then return query select 'PIN_NOT_AVAILABLE'::text, null::integer; return; end if;
  if v_code.consumed_at is not null then return query select 'PIN_USED'::text, null::integer; return; end if;
  if v_code.expires_at is not null and v_code.expires_at < now() then return query select 'PIN_EXPIRED'::text, null::integer; return; end if;
  if v_code.locked_until is not null and v_code.locked_until > now() then
    return query select 'PIN_LOCKED'::text, greatest(1,ceil(extract(epoch from (v_code.locked_until-now())))::integer); return;
  end if;

  v_hash := encode(digest(trim(p_pin),'sha256'),'hex');
  if v_hash <> v_code.code_hash then
    v_attempts := v_code.failed_attempts + 1;
    update public.tap_plate_activation_codes
      set failed_attempts=v_attempts,
          locked_until=case when v_attempts >= 5 then now()+interval '15 minutes' else null end
      where plate_id=v_plate.id;
    if v_attempts >= 5 then return query select 'PIN_LOCKED'::text, 900; else return query select 'PIN_INVALID'::text, null::integer; end if;
    return;
  end if;

  update public.tap_plate_activation_codes set failed_attempts=0, locked_until=null where plate_id=v_plate.id;
  return query select 'PIN_OK'::text, null::integer;
end;
$$;

-- Operação atômica: vincula dono/cliente, cria destino, consome PIN e trava a configuração pública.
create or replace function public.tap_claim_plate_once(
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
returns table(result_code text, plate_id uuid, client_id uuid, configured_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plate public.tap_plates%rowtype;
  v_code public.tap_plate_activation_codes%rowtype;
  v_client uuid;
  v_destination uuid;
  v_now timestamptz := now();
begin
  if p_user is null then return query select 'USER_NOT_FOUND',null::uuid,null::uuid,null::timestamptz; return; end if;
  if char_length(trim(coalesce(p_company_name,''))) < 2 then return query select 'COMPANY_REQUIRED',null::uuid,null::uuid,null::timestamptz; return; end if;
  if p_type not in ('google','whatsapp','instagram','smart','map','custom') then return query select 'TYPE_INVALID',null::uuid,null::uuid,null::timestamptz; return; end if;
  if p_url is null or p_url !~ '^https://' then return query select 'URL_INVALID',null::uuid,null::uuid,null::timestamptz; return; end if;

  select * into v_plate from public.tap_plates where code=upper(trim(p_plate_code)) for update;
  if not found then return query select 'PLATE_NOT_FOUND',null::uuid,null::uuid,null::timestamptz; return; end if;
  if v_plate.configuration_locked or v_plate.setup_status='completed' or v_plate.owner_user_id is not null or v_plate.status='active' then
    return query select 'ALREADY_CONFIGURED',v_plate.id,v_plate.client_id,v_plate.configured_at; return;
  end if;
  if v_plate.status not in ('inventory','unconfigured') then return query select 'PLATE_UNAVAILABLE',v_plate.id,null::uuid,null::timestamptz; return; end if;

  select * into v_code from public.tap_plate_activation_codes where plate_id=v_plate.id for update;
  if not found then return query select 'PIN_NOT_AVAILABLE',v_plate.id,null::uuid,null::timestamptz; return; end if;
  if v_code.consumed_at is not null then return query select 'PIN_USED',v_plate.id,null::uuid,null::timestamptz; return; end if;
  if v_code.expires_at is not null and v_code.expires_at < v_now then return query select 'PIN_EXPIRED',v_plate.id,null::uuid,null::timestamptz; return; end if;
  if v_code.locked_until is not null and v_code.locked_until > v_now then return query select 'PIN_LOCKED',v_plate.id,null::uuid,null::timestamptz; return; end if;
  if encode(digest(trim(p_pin),'sha256'),'hex') <> v_code.code_hash then return query select 'PIN_INVALID',v_plate.id,null::uuid,null::timestamptz; return; end if;

  insert into public.tap_clients(name,contact_name,phone,email,status,created_by)
  values(trim(p_company_name),nullif(trim(coalesce(p_contact_name,'')),''),nullif(trim(coalesce(p_phone,'')),''),nullif(lower(trim(coalesce(p_email,''))),''),'active',p_user)
  returning id into v_client;

  insert into public.tap_client_members(client_id,user_id,role,active)
  values(v_client,p_user,'owner',true)
  on conflict(client_id,user_id) do update set role='owner',active=true;

  insert into public.tap_plate_destinations(plate_id,type,label,url,is_active,created_by)
  values(v_plate.id,p_type,p_label,p_url,true,p_user)
  returning id into v_destination;

  update public.tap_plates set
    client_id=v_client, owner_user_id=p_user, current_destination_id=v_destination,
    status='active', setup_status='completed', configuration_locked=true,
    activated_at=coalesce(activated_at,v_now), configured_at=v_now, configured_by=p_user, claimed_at=v_now
  where id=v_plate.id;

  update public.tap_plate_activation_codes set consumed_at=v_now, failed_attempts=0, locked_until=null where plate_id=v_plate.id;
  insert into public.tap_audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
  values(p_user,'plate.public_activation','plate',v_plate.id,jsonb_build_object('client_id',v_client,'destination_id',v_destination,'type',p_type));

  return query select 'OK'::text,v_plate.id,v_client,v_now;
end;
$$;

revoke all on function public.tap_check_activation_pin(text,text) from public, anon, authenticated;
revoke all on function public.tap_claim_plate_once(text,text,uuid,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.tap_check_activation_pin(text,text) to service_role;
grant execute on function public.tap_claim_plate_once(text,text,uuid,text,text,text,text,text,text,text) to service_role;

-- Atualiza a view administrativa com o estado de ativação da V3.3.
create or replace view public.tap_plate_admin_view as
select
  p.id, p.code, p.name, p.client_id, c.name as client_name, p.status,
  p.current_destination_id, d.type as destination_type, d.label as destination_label, d.url as destination_url,
  p.owner_user_id, p.setup_status, p.configuration_locked, p.configured_at, p.configured_by, p.claimed_at,
  p.activated_at, p.created_at,
  coalesce(s.scans_today,0)::bigint as scans_today,
  coalesce(s.scans_month,0)::bigint as scans_month,
  coalesce(s.scans_total,0)::bigint as scans_total,
  coalesce(s.qr_scans,0)::bigint as qr_scans,
  coalesce(s.nfc_scans,0)::bigint as nfc_scans
from public.tap_plates p
left join public.tap_clients c on c.id=p.client_id
left join public.tap_plate_destinations d on d.id=p.current_destination_id
left join (
  select plate_id,
    count(*) filter(where occurred_at>=date_trunc('day',now())) as scans_today,
    count(*) filter(where occurred_at>=date_trunc('month',now())) as scans_month,
    count(*) as scans_total,
    count(*) filter(where source='qr') as qr_scans,
    count(*) filter(where source='nfc') as nfc_scans
  from public.tap_scan_events group by plate_id
) s on s.plate_id=p.id;

grant select on public.tap_plate_admin_view to service_role;
