select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tap_plate_activation_codes'
  and column_name in ('admin_pin','code_hash','consumed_at','failed_attempts','locked_until')
order by ordinal_position;

select
  p.code,
  p.status,
  p.setup_status,
  a.admin_pin,
  a.consumed_at
from public.tap_plates p
left join public.tap_plate_activation_codes a on a.plate_id = p.id
order by p.created_at desc
limit 20;
