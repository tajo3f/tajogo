-- TAJO TAP V7.0 — verificação do módulo Wi-Fi Connect
select
  to_regclass('public.tap_wifi_profiles') as wifi_profiles,
  to_regclass('public.tap_smart_pages') as smart_pages,
  to_regclass('public.tap_plates') as plates;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public'
  and table_name='tap_wifi_profiles'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid='public.tap_wifi_profiles'::regclass
order by conname;

select
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', 'public.tap_wifi_profiles', 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', 'public.tap_wifi_profiles', 'SELECT') as authenticated_can_select,
  has_table_privilege('service_role', 'public.tap_wifi_profiles', 'SELECT') as service_role_can_select
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='tap_wifi_profiles';

select tgname
from pg_trigger
where tgrelid='public.tap_wifi_profiles'::regclass
  and not tgisinternal
order by tgname;
