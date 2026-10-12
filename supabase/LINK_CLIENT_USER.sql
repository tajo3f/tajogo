-- Use este arquivo quando quiser liberar o portal para um cliente.
-- Crie o usuário em Authentication > Users e copie o UUID.
-- Copie também o UUID do cliente cadastrado em public.clients.

insert into public.client_members (client_id, user_id, role, active)
values ('UUID-DO-CLIENTE', 'UUID-DO-USUARIO', 'owner', true)
on conflict (client_id, user_id)
do update set role = excluded.role, active = true;
