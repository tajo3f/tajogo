select
  i.plate_id,
  p.code,
  i.email,
  i.status,
  i.created_at,
  i.claimed_at
from public.tap_client_access_invites i
join public.tap_plates p on p.id = i.plate_id
order by i.created_at desc
limit 50;
