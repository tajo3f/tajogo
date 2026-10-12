select
  to_regprocedure('public.tap_validate_activation_pin_v4(text,text)') as validate_pin_v4,
  to_regprocedure('public.tap_activate_plate_v4(text,text,uuid,text,text,text,text,text,text,text)') as activate_plate_v4,
  to_regclass('public.tap_plate_batches') as batches_table;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name='tap_plates'
  and column_name in ('batch_id','batch_position','setup_status','configuration_locked','owner_user_id','configured_at')
order by column_name;
