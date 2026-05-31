create table if not exists runhousecustom.customer_auth_users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runhousecustom.customer_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references runhousecustom.customer_auth_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists runhousecustom.customer_password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references runhousecustom.customer_auth_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_auth_sessions_user_id
  on runhousecustom.customer_auth_sessions (user_id);

create index if not exists idx_customer_auth_sessions_expires_at
  on runhousecustom.customer_auth_sessions (expires_at);

create index if not exists idx_customer_password_reset_tokens_user_id
  on runhousecustom.customer_password_reset_tokens (user_id);

create index if not exists idx_customer_password_reset_tokens_expires_at
  on runhousecustom.customer_password_reset_tokens (expires_at);

alter table if exists runhousecustom.user_profiles
  drop constraint if exists user_profiles_user_id_fkey;

alter table if exists runhousecustom.user_profiles
  add constraint user_profiles_user_id_fkey
  foreign key (user_id)
  references runhousecustom.customer_auth_users(id)
  on delete cascade;

alter table if exists runhousecustom.user_carts
  drop constraint if exists user_carts_user_id_fkey;

alter table if exists runhousecustom.user_carts
  add constraint user_carts_user_id_fkey
  foreign key (user_id)
  references runhousecustom.customer_auth_users(id)
  on delete cascade;

alter table if exists runhousecustom.orders
  drop constraint if exists orders_user_id_fkey;

alter table if exists runhousecustom.orders
  add constraint orders_user_id_fkey
  foreign key (user_id)
  references runhousecustom.customer_auth_users(id)
  on delete set null;
