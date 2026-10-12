-- TAJO TAP V3.3 — verificação da ativação única.
select
  to_regprocedure('public.tap_check_activation_pin(text,text)') as pin_function,
  to_regprocedure('public.tap_claim_plate_once(text,text,uuid,text,text,text,text,text,text,text)') as claim_function;

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tap_plates'
  and column_name in (
    'owner_user_id',
    'setup_status',
    'configuration_locked',
    'configured_at',
    'configured_by',
    'claimed_at'
  )
order by column_name;

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tap_plate_activation_codes'
  and column_name in ('failed_attempts','last_failed_at','locked_until')
order by column_name;
