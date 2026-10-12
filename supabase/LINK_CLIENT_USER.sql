-- TAJO TAP V3.2
-- Libera o portal de um cliente sem misturar com tabelas de outros sistemas.
-- Substitua os UUIDs abaixo.

insert into public.tap_client_members (client_id, user_id, role, active)
values ('UUID-DO-CLIENTE', 'UUID-DO-USUARIO', 'owner', true)
on conflict (client_id, user_id)
do update set role = excluded.role, active = true;
