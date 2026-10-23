-- TAJO TAP V8 — verificação não destrutiva
select
  to_regclass('public.tap_business_operators') as operators_table,
  to_regclass('public.tap_operator_admin_view') as operator_admin_view,
  to_regclass('public.tap_plate_admin_view') as plate_admin_view,
  to_regclass('public.tap_client_admin_view') as client_admin_view;

select table_name, column_name, data_type
from information_schema.columns
where table_schema='public'
  and (
    (table_name='tap_clients' and column_name='operator_id') or
    (table_name='tap_plates' and column_name in ('operator_id','asset_kind')) or
    (table_name='tap_smart_pages' and column_name='operator_id')
  )
order by table_name, column_name;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid='public.tap_plates'::regclass
  and conname='tap_plates_asset_kind_check';
