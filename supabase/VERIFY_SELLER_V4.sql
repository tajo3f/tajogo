select table_name from information_schema.tables where table_schema='public' and table_name in ('tap_sellers','tap_seller_leads','tap_sales','tap_seller_chat_messages') order by table_name;
select column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name='tap_sellers' order by ordinal_position;
