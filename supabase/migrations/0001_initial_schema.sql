create extension if not exists pg_net;

create sequence if not exists order_number_seq start 1001;

create type notification_type as enum ('payment_verified', 'processing', 'out_for_delivery', 'delivered', 'completed', 'new_order');
create type order_status as enum ('pending', 'processing', 'out_for_delivery', 'delivered', 'completed');
create type payment_status as enum ('pending', 'verified', 'failed');

create table carts (
  user_id uuid not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone not null default now()
);

create table categories (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  store text not null default 'restaurant'::text
);

create table delivery_zones (
  id uuid not null default gen_random_uuid(),
  name text not null,
  fee numeric(10,2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table order_status_log (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  status order_status not null,
  admin_notes text,
  created_at timestamp with time zone not null default now()
);

create table orders (
  id uuid not null default gen_random_uuid(),
  order_number text not null default ((('BF-'::text || to_char(now(), 'YYYYMMDD'::text)) || '-'::text) || lpad((nextval('order_number_seq'::regclass))::text, 5, '0'::text)),
  user_id uuid not null,
  items jsonb not null,
  subtotal numeric(14,2) not null,
  delivery_fee numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  status order_status not null default 'pending'::order_status,
  payment_status payment_status not null default 'pending'::payment_status,
  bank_reference text,
  delivery_method text not null default 'delivery'::text,
  delivery_address jsonb not null,
  receipt_confirmed boolean not null default false,
  estimated_delivery date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  payment_proof_url text,
  customer_note text,
  payment_method text not null default 'paystack'::text
);

create table products (
  id uuid not null default gen_random_uuid(),
  name text not null,
  slug text not null,
  sku text,
  category text not null,
  brand text,
  price numeric(14,2) not null,
  cost numeric(14,2),
  stock integer not null default 0,
  low_stock_threshold integer not null default 5,
  description text,
  images text[] not null default '{}'::text[],
  rating numeric(2,1) not null default 0,
  featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  in_stock boolean not null default true,
  store text not null default 'restaurant'::text,
  sort_priority integer not null default 0,
  is_combo boolean not null default false
);

create table profiles (
  id uuid not null,
  full_name text,
  phone text,
  is_admin boolean not null default false,
  total_orders integer not null default 0,
  total_spent numeric(14,2) not null default 0,
  last_purchase_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table push_subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null,
  p256dh_key text not null,
  auth_key text not null,
  created_at timestamp with time zone not null default now()
);

create table store_settings (
  id boolean not null default true,
  bank_account_name text,
  bank_name text,
  bank_account_number text,
  free_delivery_threshold numeric(14,2) not null default 100000,
  whatsapp_number text,
  support_email text,
  updated_at timestamp with time zone not null default now()
);

create table user_addresses (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  full_name text not null,
  phone text not null,
  street text not null,
  city text not null,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamp with time zone not null default now(),
  state text
);

create table wishlists (
  user_id uuid not null,
  product_ids uuid[] not null default '{}'::uuid[],
  updated_at timestamp with time zone not null default now()
);


alter table carts add constraint carts_pkey PRIMARY KEY (user_id);
alter table carts add constraint carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table categories add constraint categories_pkey PRIMARY KEY (id);
alter table categories add constraint categories_slug_key UNIQUE (slug);
alter table delivery_zones add constraint delivery_zones_pkey PRIMARY KEY (id);
alter table notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table notifications add constraint notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
alter table notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table order_status_log add constraint order_status_log_pkey PRIMARY KEY (id);
alter table order_status_log add constraint order_status_log_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
alter table orders add constraint orders_pkey PRIMARY KEY (id);
alter table orders add constraint orders_order_number_key UNIQUE (order_number);
alter table orders add constraint orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;
alter table products add constraint products_pkey PRIMARY KEY (id);
alter table products add constraint products_sku_key UNIQUE (sku);
alter table products add constraint products_slug_key UNIQUE (slug);
alter table profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table push_subscriptions add constraint push_subscriptions_pkey PRIMARY KEY (id);
alter table push_subscriptions add constraint push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);
alter table push_subscriptions add constraint push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table store_settings add constraint store_settings_pkey PRIMARY KEY (id);
alter table store_settings add constraint store_settings_id_check CHECK (id);
alter table user_addresses add constraint user_addresses_pkey PRIMARY KEY (id);
alter table user_addresses add constraint user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table wishlists add constraint wishlists_pkey PRIMARY KEY (user_id);
alter table wishlists add constraint wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

CREATE INDEX categories_store_idx ON public.categories USING btree (store);
CREATE INDEX notifications_unread_idx ON public.notifications USING btree (user_id) WHERE (NOT is_read);
CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id, created_at DESC);
CREATE INDEX order_status_log_order_id_idx ON public.order_status_log USING btree (order_id);
CREATE INDEX orders_created_at_idx ON public.orders USING btree (created_at DESC);
CREATE INDEX orders_status_idx ON public.orders USING btree (status);
CREATE INDEX orders_user_id_idx ON public.orders USING btree (user_id);
CREATE INDEX products_brand_idx ON public.products USING btree (brand);
CREATE INDEX products_category_idx ON public.products USING btree (category) WHERE is_published;
CREATE INDEX products_featured_idx ON public.products USING btree (featured) WHERE is_published;
CREATE INDEX products_store_idx ON public.products USING btree (store);
CREATE INDEX user_addresses_user_id_idx ON public.user_addresses USING btree (user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, phone, is_admin)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', lower(new.email) = 'bellefood100@gmail.com');
  insert into public.carts (user_id) values (new.id);
  insert into public.wishlists (user_id) values (new.id);
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$function$;

CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform net.http_post(
    url := 'https://wpanjjgxrbyrieirutpl.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYW5qamd4cmJ5cmllaXJ1dHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDE4MDIsImV4cCI6MjEwMzQxNzgwMn0.P-OqtTxhjA61Iat0NaQj50hVYX9h2gERfwmrL57bU1A'),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.on_order_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  admin_id uuid;
begin
  insert into notifications (user_id, order_id, type, title, message)
  values (
    new.user_id,
    new.id,
    'new_order',
    'Order placed',
    'Your order ' || new.order_number || ' has been placed. We will confirm your payment shortly.'
  );

  for admin_id in select id from profiles where is_admin loop
    insert into notifications (user_id, order_id, type, title, message)
    values (
      admin_id,
      new.id,
      'new_order',
      'New order received',
      new.order_number || ' placed for ' || to_char(new.total, 'FM999,999,999') || ' naira.'
    );
  end loop;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.on_order_paid()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.payment_status = 'verified' and old.payment_status is distinct from 'verified' then
    update profiles
    set total_orders = total_orders + 1,
        total_spent = total_spent + new.total,
        last_purchase_at = now()
    where id = new.user_id;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.on_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  notif_type notification_type;
  notif_title text;
  notif_message text;
begin
  if new.payment_status = 'verified' and old.payment_status is distinct from 'verified' then
    insert into notifications (user_id, order_id, type, title, message)
    values (new.user_id, new.id, 'payment_verified', 'Payment verified', 'We''ve confirmed your payment for ' || new.order_number || '. Your order is being processed.');
  end if;
  if new.status is distinct from old.status then
    insert into order_status_log (order_id, status) values (new.id, new.status);
    case new.status
      when 'processing' then
        notif_type := 'processing'; notif_title := 'Order is being processed'; notif_message := 'We''re preparing ' || new.order_number || ' for delivery.';
      when 'out_for_delivery' then
        notif_type := 'out_for_delivery'; notif_title := 'Out for delivery'; notif_message := new.order_number || ' is on its way to you today.';
      when 'delivered' then
        notif_type := 'delivered'; notif_title := 'Delivered'; notif_message := new.order_number || ' has been delivered. Thank you!';
      when 'completed' then
        notif_type := 'completed'; notif_title := 'Order complete'; notif_message := new.order_number || ' is complete.';
      else
        notif_type := null;
    end case;
    if notif_type is not null then
      insert into notifications (user_id, order_id, type, title, message) values (new.user_id, new.id, notif_type, notif_title, notif_message);
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE TRIGGER notifications_push_delivery AFTER INSERT ON public.notifications FOR EACH ROW EXECUTE FUNCTION notify_push_on_insert();
CREATE TRIGGER orders_created_notify AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION on_order_created();
CREATE TRIGGER orders_paid_stats AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION on_order_paid();
CREATE TRIGGER orders_status_change AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION on_order_status_change();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

alter table carts enable row level security;
alter table categories enable row level security;
alter table delivery_zones enable row level security;
alter table notifications enable row level security;
alter table order_status_log enable row level security;
alter table orders enable row level security;
alter table products enable row level security;
alter table profiles enable row level security;
alter table push_subscriptions enable row level security;
alter table store_settings enable row level security;
alter table user_addresses enable row level security;
alter table wishlists enable row level security;

create policy "carts_owner" on carts for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "categories_admin_write" on categories for all to public using (is_admin()) with check (is_admin());
create policy "categories_public_read" on categories for select to public using (true);
create policy "zones_admin_all" on delivery_zones for all to public using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND p.is_admin)))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND p.is_admin))));
create policy "zones_read" on delivery_zones for select to public using (true);
create policy "notifications_owner_select" on notifications for select to public using ((user_id = auth.uid()));
create policy "notifications_owner_update" on notifications for update to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "status_log_read" on order_status_log for select to public using ((is_admin() OR (EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_status_log.order_id) AND (o.user_id = auth.uid()))))));
create policy "orders_admin_update" on orders for update to public using (is_admin()) with check (is_admin());
create policy "orders_owner_confirm" on orders for update to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "orders_owner_insert" on orders for insert to public with check ((user_id = auth.uid()));
create policy "orders_owner_select" on orders for select to public using (((user_id = auth.uid()) OR is_admin()));
create policy "products_admin_write" on products for all to public using (is_admin()) with check (is_admin());
create policy "products_public_read" on products for select to public using ((is_published OR is_admin()));
create policy "profiles_self_select" on profiles for select to public using (((id = auth.uid()) OR is_admin()));
create policy "profiles_self_update" on profiles for update to public using ((id = auth.uid()));
create policy "push_owner" on push_subscriptions for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "settings_admin_write" on store_settings for update to public using (is_admin()) with check (is_admin());
create policy "settings_public_read" on store_settings for select to public using (true);
create policy "addresses_owner" on user_addresses for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
create policy "wishlists_owner" on wishlists for all to public using ((user_id = auth.uid())) with check ((user_id = auth.uid()));
