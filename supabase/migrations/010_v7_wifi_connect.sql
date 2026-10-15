-- TAJO TAP V7.0 — Wi-Fi Connect + Smart Page híbrida
-- Execute APÓS 009. Não apaga plaquinhas, clientes, vendas ou Smart Pages.
-- A senha do Wi-Fi NÃO é salva em texto puro nesta tabela: o backend V7 usa AES-256-GCM.

begin;

create table if not exists public.tap_wifi_profiles (
  id uuid primary key default gen_random_uuid(),
  plate_id uuid not null references public.tap_plates(id) on delete cascade,
  smart_page_id uuid not null references public.tap_smart_pages(id) on delete cascade,
  mode text not null default 'hybrid' check (mode in ('wifi','hybrid')),
  ssid text not null check (octet_length(ssid) between 1 and 32),
  security text not null default 'WPA' check (security in ('WPA','WEP','nopass')),
  password_ciphertext text,
  password_iv text,
  password_tag text,
  hidden boolean not null default false,
  public_enabled boolean not null default true,
  direct_qr_enabled boolean not null default true,
  label text not null default 'Wi-Fi do estabelecimento' check (char_length(label) between 1 and 80),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tap_wifi_profiles_plate_unique unique (plate_id),
  constraint tap_wifi_profiles_smart_page_unique unique (smart_page_id),
  constraint tap_wifi_profiles_secret_shape check (
    (security = 'nopass' and password_ciphertext is null and password_iv is null and password_tag is null)
    or
    (security <> 'nopass' and password_ciphertext is not null and password_iv is not null and password_tag is not null)
  )
);

create index if not exists tap_wifi_profiles_mode_idx
  on public.tap_wifi_profiles(mode, updated_at desc);

create index if not exists tap_wifi_profiles_public_idx
  on public.tap_wifi_profiles(public_enabled, updated_at desc);

drop trigger if exists tap_wifi_profiles_updated_at on public.tap_wifi_profiles;
create trigger tap_wifi_profiles_updated_at
before update on public.tap_wifi_profiles
for each row execute function public.tap_set_updated_at();


-- V6 possuía campos legados em texto puro. Mantemos as colunas por compatibilidade,
-- mas o backend V7 deixa de gravar senhas nelas e limpa o valor após salvar no cofre V7.
comment on column public.tap_smart_pages.wifi_password is
  'LEGADO V6. Não usar para novas gravações. V7 usa public.tap_wifi_profiles com segredo cifrado no backend.';

alter table public.tap_wifi_profiles enable row level security;
revoke all on public.tap_wifi_profiles from anon, authenticated;
grant all on public.tap_wifi_profiles to service_role;

-- Nenhuma política browser-side: acesso passa obrigatoriamente pelo backend TAJO.

commit;

select
  to_regclass('public.tap_wifi_profiles') as wifi_profiles,
  (select count(*) from information_schema.columns
   where table_schema='public' and table_name='tap_wifi_profiles' and column_name='password_ciphertext') as encrypted_secret_column,
  (select count(*) from information_schema.table_constraints
   where table_schema='public' and table_name='tap_wifi_profiles' and constraint_name='tap_wifi_profiles_secret_shape') as secret_shape_constraint;
