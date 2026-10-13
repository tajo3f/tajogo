select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='tap_plate_batches'
  and column_name in ('seller_id','assigned_email','model','width_cm','height_cm','unit_cost_cents','supplier','production_status','print_file_name')
order by column_name;

select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='tap_plates'
  and column_name in ('seller_id','production_status','sent_to_print_at','produced_at','in_stock_at','sold_at','delivered_at')
order by column_name;
