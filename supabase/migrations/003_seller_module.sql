begin;

create table if not exists public.tap_sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  commission_rate numeric(5,2) not null default 30.00 check (commission_rate >= 0 and commission_rate <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tap_seller_leads (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.tap_sellers(id) on delete cascade,
  business_name text not null,
  contact_name text,
  phone text,
  instagram text,
  city text,
  niche text,
  status text not null default 'novo' check (status in ('novo','contatado','respondeu','negociacao','proposta','fechado','perdido')),
  notes text,
  next_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tap_sales (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.tap_sellers(id) on delete restrict,
  client_id uuid references public.tap_clients(id) on delete set null,
  plate_id uuid references public.tap_plates(id) on delete set null,
  customer_name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  commission_cents integer not null check (commission_cents >= 0),
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  notes text,
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tap_seller_chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  sender_seller_id uuid references public.tap_sellers(id) on delete set null,
  sender_name text not null,
  sender_role text not null check (sender_role in ('seller','admin')),
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);

create index if not exists tap_seller_leads_seller_idx on public.tap_seller_leads(seller_id, created_at desc);
create index if not exists tap_sales_seller_idx on public.tap_sales(seller_id, sold_at desc);
create index if not exists tap_chat_created_idx on public.tap_seller_chat_messages(created_at desc);

alter table public.tap_sellers enable row level security;
alter table public.tap_seller_leads enable row level security;
alter table public.tap_sales enable row level security;
alter table public.tap_seller_chat_messages enable row level security;

-- Browser access is intentionally denied. All seller operations pass through the TAJO backend,
-- which authenticates the user and applies seller isolation before using the server secret.
revoke all on public.tap_sellers from anon, authenticated;
revoke all on public.tap_seller_leads from anon, authenticated;
revoke all on public.tap_sales from anon, authenticated;
revoke all on public.tap_seller_chat_messages from anon, authenticated;
grant all on public.tap_sellers to service_role;
grant all on public.tap_seller_leads to service_role;
grant all on public.tap_sales to service_role;
grant all on public.tap_seller_chat_messages to service_role;

commit;
