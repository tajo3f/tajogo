-- 1) Crie sua conta em Supabase > Authentication > Users.
-- 2) Copie o UUID do seu usuário.
-- 3) Substitua SEU-UUID-AQUI e execute.

insert into public.platform_admins (user_id, role, active)
values ('SEU-UUID-AQUI', 'super_admin', true)
on conflict (user_id)
do update set role = excluded.role, active = true;
