select
  to_regprocedure('public.tap_validate_activation_pin_v4(text,text)') as validate_pin_v4,
  to_regprocedure('public.tap_activate_plate_v4(text,text,uuid,text,text,text,text,text,text,text)') as activate_plate_v4;

select
  routine_name,
  data_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('tap_validate_activation_pin_v4','tap_activate_plate_v4')
order by routine_name;

select pg_notify('pgrst', 'reload schema');
