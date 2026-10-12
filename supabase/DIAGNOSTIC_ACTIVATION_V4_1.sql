-- Troque o código abaixo se quiser diagnosticar outra unidade.
select
  p.code,
  p.status,
  p.setup_status,
  p.configuration_locked,
  p.owner_user_id,
  p.client_id,
  p.current_destination_id,
  p.configured_at,
  a.failed_attempts,
  a.last_failed_at,
  a.locked_until,
  a.consumed_at,
  a.expires_at
from public.tap_plates p
left join public.tap_plate_activation_codes a on a.plate_id = p.id
where p.code = 'TT-LFBTXK';
