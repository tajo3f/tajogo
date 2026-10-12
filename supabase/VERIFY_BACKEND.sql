-- TAJO TAP V3.2 — verificação rápida após executar a migration.
-- Deve retornar 9 tabelas principais e as views/função abaixo.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'tap_profiles',
    'tap_platform_admins',
    'tap_clients',
    'tap_client_members',
    'tap_plates',
    'tap_plate_destinations',
    'tap_plate_activation_codes',
    'tap_scan_events',
    'tap_audit_logs'
  )
order by table_name;

select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in ('tap_plate_admin_view','tap_client_admin_view')
order by table_name;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('tap_set_plate_destination','tap_is_platform_admin','tap_is_client_member')
order by routine_name;
