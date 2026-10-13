-- TAJO TAP V5 — Distribuição por lote + Central de Produção + Dashboard Operacional
-- Execute APÓS 001..006. Não apaga dados existentes.

begin;

-- ---------------------------------------------------------------------------
-- Lotes: responsável comercial e metadados de produção
-- ---------------------------------------------------------------------------
alter table public.tap_plate_batches add column if not exists seller_id uuid references public.tap_sellers(id) on delete set null;
alter table public.tap_plate_batches add column if not exists assigned_email text;
alter table public.tap_plate_batches add column if not exists assigned_at timestamptz;
alter table public.tap_plate_batches add column if not exists assigned_by uuid references auth.users(id) on delete set null;
alter table public.tap_plate_batches add column if not exists model text;
alter table public.tap_plate_batches add column if not exists width_cm numeric(6,2);
alter table public.tap_plate_batches add column if not exists height_cm numeric(6,2);
alter table public.tap_plate_batches add column if not exists unit_cost_cents integer;
alter table public.tap_plate_batches add column if not exists supplier text;
alter table public.tap_plate_batches add column if not exists production_status text;
alter table public.tap_plate_batches add column if not exists print_file_name text;
alter table public.tap_plate_batches add column if not exists production_notes text;

update public.tap_plate_batches
set model = coalesce(model, 'Padrão TAJO TAP'),
    width_cm = coalesce(width_cm, 10.00),
    height_cm = coalesce(height_cm, 8.00),
    unit_cost_cents = coalesce(unit_cost_cents, 0),
    production_status = coalesce(production_status,
      case
        when status = 'sent_to_print' then 'sent_to_print'
        when status = 'completed' then 'in_stock'
        when status = 'cancelled' then 'cancelled'
        else 'generated'
      end),
    print_file_name = coalesce(print_file_name, batch_code || '-IMPRESSAO.html')
where model is null
   or width_cm is null
   or height_cm is null
   or unit_cost_cents is null
   or production_status is null
   or print_file_name is null;

alter table public.tap_plate_batches alter column model set default 'Padrão TAJO TAP';
alter table public.tap_plate_batches alter column width_cm set default 10.00;
alter table public.tap_plate_batches alter column height_cm set default 8.00;
alter table public.tap_plate_batches alter column unit_cost_cents set default 0;
alter table public.tap_plate_batches alter column production_status set default 'generated';

alter table public.tap_plate_batches drop constraint if exists tap_plate_batches_production_status_check;
alter table public.tap_plate_batches add constraint tap_plate_batches_production_status_check
  check (production_status in ('generated','sent_to_print','produced','in_stock','cancelled'));

alter table public.tap_plate_batches drop constraint if exists tap_plate_batches_unit_cost_check;
alter table public.tap_plate_batches add constraint tap_plate_batches_unit_cost_check
  check (unit_cost_cents is null or unit_cost_cents >= 0);

alter table public.tap_plate_batches drop constraint if exists tap_plate_batches_size_check;
alter table public.tap_plate_batches add constraint tap_plate_batches_size_check
  check ((width_cm is null or width_cm > 0) and (height_cm is null or height_cm > 0));

-- ---------------------------------------------------------------------------
-- Plaquinhas: estoque físico, dono comercial e linha do tempo produtiva
-- ---------------------------------------------------------------------------
alter table public.tap_plates add column if not exists seller_id uuid references public.tap_sellers(id) on delete set null;
alter table public.tap_plates add column if not exists production_status text;
alter table public.tap_plates add column if not exists production_status_updated_at timestamptz;
alter table public.tap_plates add column if not exists sent_to_print_at timestamptz;
alter table public.tap_plates add column if not exists produced_at timestamptz;
alter table public.tap_plates add column if not exists in_stock_at timestamptz;
alter table public.tap_plates add column if not exists sold_at timestamptz;
alter table public.tap_plates add column if not exists delivered_at timestamptz;

update public.tap_plates p
set seller_id = coalesce(p.seller_id, b.seller_id),
    production_status = coalesce(p.production_status,
      case
        when p.status = 'active' or p.setup_status = 'completed' then 'activated'
        else 'generated'
      end),
    production_status_updated_at = coalesce(p.production_status_updated_at, p.updated_at, p.created_at, now())
from public.tap_plate_batches b
where p.batch_id = b.id
  and (p.seller_id is null or p.production_status is null or p.production_status_updated_at is null);

update public.tap_plates
set production_status = case
      when status = 'active' or setup_status = 'completed' then 'activated'
      else 'generated'
    end,
    production_status_updated_at = coalesce(production_status_updated_at, updated_at, created_at, now())
where production_status is null;

alter table public.tap_plates alter column production_status set default 'generated';
alter table public.tap_plates alter column production_status_updated_at set default now();

alter table public.tap_plates drop constraint if exists tap_plates_production_status_check;
alter table public.tap_plates add constraint tap_plates_production_status_check
  check (production_status in ('generated','sent_to_print','produced','in_stock','sold','delivered','activated'));

create index if not exists tap_plate_batches_seller_idx on public.tap_plate_batches(seller_id, created_at desc);
create index if not exists tap_plate_batches_prod_status_idx on public.tap_plate_batches(production_status, created_at desc);
create index if not exists tap_plates_seller_prod_idx on public.tap_plates(seller_id, production_status, created_at desc);
create index if not exists tap_plates_prod_status_idx on public.tap_plates(production_status, production_status_updated_at desc);

-- Atualiza o estoque físico automaticamente para unidades já ativadas.
update public.tap_plates
set production_status = 'activated',
    production_status_updated_at = coalesce(configured_at, activated_at, now())
where (status = 'active' or setup_status = 'completed')
  and production_status <> 'activated';


-- ---------------------------------------------------------------------------
-- Leitura operacional agregada para evitar inferência por amostragem de scans.
-- ---------------------------------------------------------------------------
create or replace view public.tap_plate_activity_v5 as
select
  p.id as plate_id,
  max(se.occurred_at) as last_scan_at,
  count(se.id) filter (where se.occurred_at >= now() - interval '30 days')::bigint as scans_30d
from public.tap_plates p
left join public.tap_scan_events se on se.plate_id = p.id
group by p.id;

revoke all on public.tap_plate_activity_v5 from anon, authenticated;
grant select on public.tap_plate_activity_v5 to service_role;

-- Browser não acessa metadados sensíveis diretamente; backend aplica isolamento por vendedor.
revoke all on table public.tap_plate_batches from anon, authenticated;
grant all on table public.tap_plate_batches to service_role;

commit;

-- Verificação rápida
select
  to_regclass('public.tap_plate_batches') as batches,
  (select count(*) from information_schema.columns where table_schema='public' and table_name='tap_plate_batches' and column_name in ('seller_id','model','width_cm','height_cm','unit_cost_cents','supplier','production_status','print_file_name')) as batch_v5_columns,
  (select count(*) from information_schema.columns where table_schema='public' and table_name='tap_plates' and column_name in ('seller_id','production_status','sent_to_print_at','produced_at','in_stock_at','sold_at','delivered_at')) as plate_v5_columns;
