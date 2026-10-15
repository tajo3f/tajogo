select
  to_regclass('public.tap_smart_pages') as smart_pages,
  to_regclass('public.tap_smart_page_events') as smart_events,
  to_regclass('public.tap_client_access_invites') as access_invites;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name='tap_smart_pages'
order by ordinal_position;

select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='tap_sales' and column_name='customer_email';
