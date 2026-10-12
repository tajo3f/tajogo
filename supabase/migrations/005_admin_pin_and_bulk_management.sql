-- TAJO TAP V4.2 — PIN administrativo persistente + gestão em massa
-- Execute APÓS 001, 002, 003 e 004.
-- Não apaga dados existentes.
-- PINs antigos que já existiam apenas como hash NÃO podem ser recuperados.
-- Para esses casos, use "Gerar novo PIN" no painel administrativo.

alter table public.tap_plate_activation_codes
  add column if not exists admin_pin text;

alter table public.tap_plate_activation_codes
  drop constraint if exists tap_activation_admin_pin_check;

alter table public.tap_plate_activation_codes
  add constraint tap_activation_admin_pin_check
  check (admin_pin is null or admin_pin ~ '^[0-9]{6}$');

comment on column public.tap_plate_activation_codes.admin_pin is
  'PIN de ativação visível somente ao backend administrativo TAJO TAP. Códigos legados permanecem nulos até redefinição.';

-- Reforço de acesso: navegador autenticado/anon não lê esta tabela diretamente.
revoke all on table public.tap_plate_activation_codes from anon, authenticated;
grant all on table public.tap_plate_activation_codes to service_role;

-- Verificação rápida
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tap_plate_activation_codes'
  and column_name = 'admin_pin';
