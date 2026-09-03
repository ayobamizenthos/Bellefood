create type order_status as enum (
  'pending', 'processing', 'out_for_delivery', 'delivered', 'completed'
);

create type payment_status as enum ('pending', 'verified', 'failed');

create type notification_type as enum (
  'payment_verified', 'processing', 'out_for_delivery', 'delivered', 'completed', 'installation'
);

create type product_category as enum (
  'solar-batteries', 'inverters', 'solar-panels', 'powertanks', 'solar-cables'
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  total_orders integer not null default 0,
  total_spent numeric(14, 2) not null default 0,
  last_purchase_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index user_addresses_user_id_idx on user_addresses(user_id);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  sku text unique,
  category product_category not null,
  brand text,
  price numeric(14, 2) not null,
  cost numeric(14, 2),
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  description text,
  specs jsonb not null default '{}'::jsonb,
  images text[] not null default '{}',
  rating numeric(2, 1) not null default 0,
  featured boolean not null default false,
  is_published boolean not null default true,
  cable_pricing jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on products(category) where is_published;
create index products_featured_idx on products(featured) where is_published;
create index products_brand_idx on products(brand);

create table carts (
  user_id uuid primary key references profiles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table wishlists (
  user_id uuid primary key references profiles(id) on delete cascade,
  product_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default 'ZEN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  user_id uuid not null references profiles(id) on delete restrict,
  items jsonb not null,
  subtotal numeric(14, 2) not null,
  delivery_fee numeric(14, 2) not null default 0,
  installation_fee numeric(14, 2) not null default 0,
  total numeric(14, 2) not null,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  bank_reference text,
  delivery_method text not null default 'standard',
  delivery_address jsonb not null,
  installation_requested boolean not null default false,
  receipt_confirmed boolean not null default false,
  estimated_delivery date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_id_idx on orders(user_id);
create index orders_status_idx on orders(status);
create index orders_created_at_idx on orders(created_at desc);

create table order_status_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  admin_notes text,
  created_at timestamptz not null default now()
);
create index order_status_log_order_id_idx on order_status_log(order_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id) where not is_read;

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table store_settings (
  id boolean primary key default true check (id),
  bank_account_name text,
  bank_name text,
  bank_account_number text,
  free_delivery_threshold numeric(14, 2) not null default 900000,
  installation_fee numeric(14, 2) not null default 50000,
  standard_delivery_fee numeric(14, 2) not null default 15000,
  express_delivery_fee numeric(14, 2) not null default 35000,
  whatsapp_number text,
  support_email text,
  updated_at timestamptz not null default now()
);
insert into store_settings (id) values (true);
