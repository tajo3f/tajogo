-- TAJO TAP V6.2 — vínculo de compra por plaquinha/e-mail
-- Execute APÓS 008. Não apaga clientes, vendas, Smart Pages ou plaquinhas.

begin;

-- A V6 original usava unique(client_id,email), o que fazia uma nova compra do
-- mesmo cliente poder mover o convite da plaquinha anterior. Na V6.2 o convite
-- pendente pertence à plaquinha específica.
alter table public.tap_client_access_invites
  drop constraint if exists tap_client_access_invites_client_id_email_key;

create unique index if not exists tap_client_access_invites_one_pending_per_plate
  on public.tap_client_access_invites(plate_id)
  where plate_id is not null and status = 'pending';

create index if not exists tap_client_access_invites_plate_status_idx
  on public.tap_client_access_invites(plate_id, status, created_at desc);

-- Recupera vendas anteriores que tenham e-mail e ainda não possuam convite
-- pendente para a plaquinha. Isso corrige testes/plaquinhas já vendidas antes
-- da V6.2 sem alterar uma ativação já concluída.
insert into public.tap_client_access_invites (client_id, plate_id, seller_id, email, status)
select
  s.client_id,
  s.plate_id,
  s.seller_id,
  lower(trim(s.customer_email)),
  'pending'
from public.tap_sales s
join public.tap_plates p on p.id = s.plate_id
where s.client_id is not null
  and s.plate_id is not null
  and nullif(trim(s.customer_email), '') is not null
  and coalesce(p.setup_status, 'pending') <> 'completed'
  and coalesce(p.configuration_locked, false) = false
  and not exists (
    select 1
    from public.tap_client_access_invites i
    where i.plate_id = s.plate_id
      and i.status = 'pending'
  );

commit;

select
  to_regclass('public.tap_client_access_invites') as access_invites,
  to_regclass('public.tap_client_access_invites_one_pending_per_plate') as pending_plate_unique_index;
