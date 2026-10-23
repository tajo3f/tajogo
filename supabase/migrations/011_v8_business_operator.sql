-- TAJO TAP V8 — Operadores Business / licença comercial
-- Execute APÓS 001..010. Migration incremental: preserva clientes, plaquinhas,
-- vendedores, Smart Pages e ativações existentes.

begin;

-- ---------------------------------------------------------------------------
-- Operadores: alunos/licenciados do TAJO TAP BUSINESS.
-- O operador usa a plataforma para atender a própria carteira, mas não recebe
-- código-fonte nem propriedade do software.
-- ---------------------------------------------------------------------------
create table if not exists public.tap_business_operators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  brand_name text not null check (char_length(brand_name) between 2 and 120),
  business_email text,
  phone text,
  plan text not null default 'business' check (plan in ('founders','business','custom')),
  active boolean not null default true,
  qr_limit integer not null default 50 check (qr_limit between 1 and 100000),
  client_limit integer not null default 100 check (client_limit between 1 and 100000),
  smart_page_limit integer not null default 50 check (smart_page_limit between 0 and 100000),
  license_starts_at timestamptz not null default now(),
  license_ends_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (license_ends_at is null or license_ends_at > license_starts_at)
);

drop trigger if exists tap_business_operators_updated_at on public.tap_business_operators;
create trigger tap_business_operators_updated_at
before update on public.tap_business_operators
for each row execute function public.tap_set_updated_at();

create index if not exists tap_business_operators_user_idx
  on public.tap_business_operators(user_id);
create index if not exists tap_business_operators_license_idx
  on public.tap_business_operators(active, license_ends_at);

-- ---------------------------------------------------------------------------
-- Isolamento multioperador. Registros antigos continuam com operator_id nulo.
-- ---------------------------------------------------------------------------
alter table public.tap_clients
  add column if not exists operator_id uuid references public.tap_business_operators(id) on delete set null;

alter table public.tap_plates
  add column if not exists operator_id uuid references public.tap_business_operators(id) on delete set null;

alter table public.tap_plates
  add column if not exists asset_kind text not null default 'smart_plate';

alter table public.tap_plates
  drop constraint if exists tap_plates_asset_kind_check;
alter table public.tap_plates
  add constraint tap_plates_asset_kind_check
  check (asset_kind in ('smart_plate','dynamic_qr'));

alter table public.tap_smart_pages
  add column if not exists operator_id uuid references public.tap_business_operators(id) on delete set null;

create index if not exists tap_clients_operator_idx
  on public.tap_clients(operator_id, created_at desc);
create index if not exists tap_plates_operator_idx
  on public.tap_plates(operator_id, created_at desc);
create index if not exists tap_plates_operator_kind_idx
  on public.tap_plates(operator_id, asset_kind, status, created_at desc);
create index if not exists tap_smart_pages_operator_idx
  on public.tap_smart_pages(operator_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Read model administrativo atualizado. As colunas históricas permanecem na
-- mesma ordem; os campos V8 são anexados ao final para compatibilidade.
-- ---------------------------------------------------------------------------
create or replace view public.tap_plate_admin_view as
select
  p.id,
  p.code,
  p.name,
  p.client_id,
  c.name as client_name,
  p.status,
  p.current_destination_id,
  d.type as destination_type,
  d.label as destination_label,
  d.url as destination_url,
  p.activated_at,
  p.created_at,
  coalesce(s.scans_today, 0)::bigint as scans_today,
  coalesce(s.scans_month, 0)::bigint as scans_month,
  coalesce(s.scans_total, 0)::bigint as scans_total,
  coalesce(s.qr_scans, 0)::bigint as qr_scans,
  coalesce(s.nfc_scans, 0)::bigint as nfc_scans,
  p.owner_user_id,
  p.setup_status,
  p.configuration_locked,
  p.configured_at,
  p.configured_by,
  p.claimed_at,
  p.operator_id,
  p.asset_kind
from public.tap_plates p
left join public.tap_clients c on c.id = p.client_id
left join public.tap_plate_destinations d on d.id = p.current_destination_id
left join (
  select
    plate_id,
    count(*) filter (where occurred_at >= date_trunc('day', now())) as scans_today,
    count(*) filter (where occurred_at >= date_trunc('month', now())) as scans_month,
    count(*) as scans_total,
    count(*) filter (where source = 'qr') as qr_scans,
    count(*) filter (where source = 'nfc') as nfc_scans
  from public.tap_scan_events
  group by plate_id
) s on s.plate_id = p.id;

create or replace view public.tap_client_admin_view as
select
  c.id,
  c.name,
  c.contact_name,
  c.phone,
  c.email,
  c.city,
  c.state,
  c.status,
  c.created_at,
  count(distinct p.id)::bigint as plates_count,
  count(se.id)::bigint as scans_total,
  c.operator_id
from public.tap_clients c
left join public.tap_plates p on p.client_id = c.id
left join public.tap_scan_events se on se.plate_id = p.id
group by c.id;

create or replace view public.tap_operator_admin_view as
select
  o.id,
  o.user_id,
  o.brand_name,
  o.business_email,
  o.phone,
  o.plan,
  o.active,
  o.qr_limit,
  o.client_limit,
  o.smart_page_limit,
  o.license_starts_at,
  o.license_ends_at,
  o.notes,
  o.created_at,
  o.updated_at,
  (select count(*) from public.tap_clients c where c.operator_id = o.id)::bigint as clients_count,
  (select count(*) from public.tap_plates p where p.operator_id = o.id and p.status <> 'archived')::bigint as qrs_count,
  (select count(*) from public.tap_smart_pages sp where sp.operator_id = o.id)::bigint as smart_pages_count,
  (select count(*) from public.tap_scan_events se join public.tap_plates p on p.id = se.plate_id where p.operator_id = o.id)::bigint as scans_total
from public.tap_business_operators o;


-- ---------------------------------------------------------------------------
-- Segurança: operadores nunca acessam as tabelas diretamente pelo navegador.
-- Toda operação passa pelo backend, que aplica isolamento por operator_id.
-- ---------------------------------------------------------------------------
alter table public.tap_business_operators enable row level security;
revoke all on public.tap_business_operators from anon, authenticated;
grant all on public.tap_business_operators to service_role;

grant select on public.tap_operator_admin_view to service_role;
revoke all on public.tap_operator_admin_view from anon, authenticated;

grant select on public.tap_plate_admin_view to service_role;
revoke all on public.tap_plate_admin_view from anon, authenticated;
grant select on public.tap_client_admin_view to service_role;
revoke all on public.tap_client_admin_view from anon, authenticated;

commit;

-- Verificação rápida
select
  to_regclass('public.tap_business_operators') as operators,
  to_regclass('public.tap_operator_admin_view') as operator_view,
  (select count(*) from information_schema.columns where table_schema='public' and table_name='tap_plates' and column_name='operator_id') as plate_operator_column,
  (select count(*) from information_schema.columns where table_schema='public' and table_name='tap_plates' and column_name='asset_kind') as asset_kind_column,
  (select count(*) from information_schema.columns where table_schema='public' and table_name='tap_smart_pages' and column_name='operator_id') as smart_operator_column;
