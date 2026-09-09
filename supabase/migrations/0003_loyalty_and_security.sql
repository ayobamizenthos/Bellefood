-- 0003: Loyalty/referrals + fintech-grade security hardening.
-- Principles: clients NEVER write money/points/payment columns. All balance and
-- pricing changes happen in SECURITY DEFINER functions; BEFORE-UPDATE guards
-- freeze protected columns for any non-trusted caller even under permissive RLS.

create extension if not exists citext;

-- ---------- schema ----------
alter table public.profiles
  add column if not exists username citext,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists points integer not null default 0;

do $$ begin
  alter table public.profiles add constraint profiles_username_unique unique (username);
exception when duplicate_object then null; end $$;

alter table public.profiles drop constraint if exists profiles_points_nonneg;
alter table public.profiles add constraint profiles_points_nonneg check (points >= 0);
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or (username)::text ~ '^[a-z0-9_]{3,20}$');

alter table public.orders
  add column if not exists payment_reference text,
  add column if not exists points_redeemed integer not null default 0,
  add column if not exists points_discount numeric not null default 0;

create table if not exists public.loyalty_settings (
  id boolean primary key default true,
  naira_per_point numeric not null default 100,
  earn_per_order integer not null default 10,
  earn_per_referral integer not null default 5,
  welcome_bonus integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint loyalty_settings_singleton check (id)
);
insert into public.loyalty_settings (id) values (true) on conflict (id) do nothing;

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  order_id uuid references public.orders(id) on delete set null,
  balance_after integer not null,
  created_at timestamptz not null default now()
);
create index if not exists points_ledger_user_idx on public.points_ledger(user_id, created_at desc);

-- ---------- RLS ----------
alter table public.loyalty_settings enable row level security;
alter table public.points_ledger enable row level security;

drop policy if exists loyalty_settings_read on public.loyalty_settings;
create policy loyalty_settings_read on public.loyalty_settings for select to public using (true);
drop policy if exists loyalty_settings_admin_write on public.loyalty_settings;
create policy loyalty_settings_admin_write on public.loyalty_settings
  for update to public using (public.is_admin()) with check (public.is_admin());

drop policy if exists points_ledger_owner_read on public.points_ledger;
create policy points_ledger_owner_read on public.points_ledger
  for select to public using (user_id = auth.uid() or public.is_admin());
-- deliberately NO write policies: only SECURITY DEFINER functions (table owner) write.

-- ---------- trusted-caller check ----------
create or replace function public.is_trusted_writer()
returns boolean language sql stable as $fn$
  select current_user in ('service_role','postgres','supabase_admin','supabase_auth_admin')
      or current_setting('app.privileged', true) = 'on';
$fn$;

-- ---------- column guards (SECURITY INVOKER so current_user reflects the caller) ----------
create or replace function public.guard_profile_update()
returns trigger language plpgsql as $fn$
begin
  if public.is_trusted_writer() then return new; end if;
  new.points := old.points;
  new.referred_by := old.referred_by;
  new.username := old.username;
  new.is_admin := old.is_admin;
  new.total_orders := old.total_orders;
  new.total_spent := old.total_spent;
  new.last_purchase_at := old.last_purchase_at;
  return new;
end;$fn$;
drop trigger if exists guard_profile_update_trg on public.profiles;
create trigger guard_profile_update_trg before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.guard_order_update()
returns trigger language plpgsql as $fn$
begin
  if public.is_trusted_writer() or public.is_admin() then return new; end if;
  -- customer path: everything frozen except confirming receipt (-> completed)
  new.subtotal := old.subtotal;
  new.delivery_fee := old.delivery_fee;
  new.total := old.total;
  new.items := old.items;
  new.payment_status := old.payment_status;
  new.payment_method := old.payment_method;
  new.payment_reference := old.payment_reference;
  new.payment_proof_url := old.payment_proof_url;
  new.bank_reference := old.bank_reference;
  new.points_redeemed := old.points_redeemed;
  new.points_discount := old.points_discount;
  new.delivery_method := old.delivery_method;
  new.delivery_address := old.delivery_address;
  new.user_id := old.user_id;
  new.order_number := old.order_number;
  new.customer_note := old.customer_note;
  new.estimated_delivery := old.estimated_delivery;
  if not (old.receipt_confirmed = false and new.receipt_confirmed = true) then
    new.receipt_confirmed := old.receipt_confirmed;
  end if;
  if new.status is distinct from old.status
     and not (new.status = 'completed' and new.receipt_confirmed = true) then
    new.status := old.status;
  end if;
  return new;
end;$fn$;
drop trigger if exists guard_order_update_trg on public.orders;
create trigger guard_order_update_trg before update on public.orders
  for each row execute function public.guard_order_update();

-- ---------- points engine ----------
create or replace function public.award_points(p_user uuid, p_delta integer, p_reason text, p_order uuid)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare new_balance integer;
begin
  if p_delta = 0 or p_user is null then return; end if;
  perform set_config('app.privileged','on',true);
  update public.profiles set points = points + p_delta where id = p_user returning points into new_balance;
  if new_balance is null then return; end if;
  insert into public.points_ledger(user_id, delta, reason, order_id, balance_after)
  values (p_user, p_delta, p_reason, p_order, new_balance);
end;$fn$;

create or replace function public.claim_username(p_username text)
returns void language plpgsql security definer set search_path to 'public' as $fn$
declare uid uuid := auth.uid(); v text := lower(trim(p_username));
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if v !~ '^[a-z0-9_]{3,20}$' then raise exception 'Username must be 3-20 letters, numbers or underscore'; end if;
  if exists (select 1 from public.profiles where username = v::citext and id <> uid) then
    raise exception 'That username is taken';
  end if;
  perform set_config('app.privileged','on',true);
  update public.profiles set username = v::citext where id = uid and username is null;
  if not found then raise exception 'Your username is already set'; end if;
end;$fn$;
grant execute on function public.claim_username(text) to authenticated;

-- earn points when payment is verified (first-time transition only)
create or replace function public.on_order_paid()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare s public.loyalty_settings; ref uuid; paid_count integer;
begin
  if new.payment_status = 'verified' and old.payment_status is distinct from 'verified' then
    perform set_config('app.privileged','on',true);
    select * into s from public.loyalty_settings where id;
    update public.profiles
      set total_orders = total_orders + 1, total_spent = total_spent + new.total, last_purchase_at = now()
      where id = new.user_id
      returning total_orders, referred_by into paid_count, ref;
    perform public.award_points(new.user_id, s.earn_per_order, 'order', new.id);
    if paid_count = 1 and ref is not null and ref <> new.user_id then
      perform public.award_points(ref, s.earn_per_referral, 'referral', new.id);
    end if;
  end if;
  return new;
end;$fn$;

-- signup: set username + resolve referrer from metadata (self-referral impossible)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare
  v_username text := lower(nullif(trim(new.raw_user_meta_data->>'username'), ''));
  v_ref text := lower(nullif(trim(new.raw_user_meta_data->>'referral'), ''));
  v_referrer uuid;
begin
  if v_username is not null and v_username !~ '^[a-z0-9_]{3,20}$' then v_username := null; end if;
  if v_username is not null and exists (select 1 from public.profiles where username = v_username::citext) then
    v_username := null;
  end if;
  if v_ref is not null then select id into v_referrer from public.profiles where username = v_ref::citext; end if;
  insert into public.profiles (id, full_name, phone, is_admin, username, referred_by)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone',
          lower(new.email) = 'bellefood100@gmail.com', v_username, v_referrer);
  insert into public.carts (user_id) values (new.id);
  insert into public.wishlists (user_id) values (new.id);
  return new;
end;$fn$;

-- ---------- server-authoritative order creation + points redemption ----------
drop function if exists public.place_order(jsonb,text,uuid,text,integer,text,text,text,text,text,text,text);
create or replace function public.place_order(
  p_items jsonb,
  p_delivery_method text,
  p_full_name text,
  p_phone text,
  p_zone_id uuid default null,
  p_payment_method text default 'paystack',
  p_points integer default 0,
  p_street text default null,
  p_landmark text default null,
  p_note text default null,
  p_bank_reference text default null,
  p_payment_proof_url text default null
) returns jsonb language plpgsql security definer set search_path to 'public' as $fn$
declare
  uid uuid := auth.uid();
  s public.loyalty_settings;
  item jsonb;
  prod record;
  qty integer;
  subtotal numeric := 0;
  kitchen_subtotal numeric := 0;
  fee numeric := 0;
  threshold numeric;
  validated jsonb := '[]'::jsonb;
  eligible numeric;
  want_points integer;
  balance integer;
  points_used integer := 0;
  discount numeric := 0;
  addr jsonb;
  new_order public.orders;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_delivery_method not in ('delivery','pickup') then raise exception 'bad fulfilment'; end if;
  if p_payment_method not in ('paystack','bank_transfer') then raise exception 'bad payment method'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'empty cart'; end if;

  select * into s from public.loyalty_settings where id;

  for item in select * from jsonb_array_elements(p_items) loop
    qty := coalesce((item->>'quantity')::int, 0);
    if qty < 1 or qty > 99 then raise exception 'bad quantity'; end if;
    select id, name, price, store, category, is_combo, images, is_published
      into prod from public.products where id = (item->>'product_id')::uuid;
    if prod.id is null or not prod.is_published then raise exception 'item unavailable'; end if;
    subtotal := subtotal + prod.price * qty;
    if prod.store = 'restaurant' then kitchen_subtotal := kitchen_subtotal + prod.price * qty; end if;
    validated := validated || jsonb_build_object(
      'kind','product','productId',prod.id,'name',prod.name,
      'image', case when jsonb_typeof(to_jsonb(prod.images))='array' and jsonb_array_length(to_jsonb(prod.images))>0 then (to_jsonb(prod.images)->>0) else null end,
      'category',prod.category,'isCombo',prod.is_combo,'store',prod.store,
      'unitPrice',prod.price,'quantity',qty
    );
  end loop;

  if p_delivery_method = 'delivery' then
    select fee into fee from public.delivery_zones where id = p_zone_id;
    if fee is null then raise exception 'invalid delivery area'; end if;
    select free_delivery_threshold into threshold from public.store_settings limit 1;
    if threshold is not null and subtotal >= threshold then fee := 0; end if;
  else
    fee := 0;
  end if;

  -- points: pay only for kitchen food + delivery, never groceries
  want_points := greatest(0, coalesce(p_points, 0));
  if want_points > 0 then
    select points into balance from public.profiles where id = uid for update;
    balance := coalesce(balance, 0);
    if want_points > balance then want_points := balance; end if;
    eligible := kitchen_subtotal + fee;
    discount := least(want_points * s.naira_per_point, eligible);
    points_used := ceil(discount / nullif(s.naira_per_point, 0))::int;
    if points_used > balance then points_used := balance; end if;
    discount := least(points_used * s.naira_per_point, eligible);
  end if;

  addr := case when p_delivery_method = 'pickup'
    then jsonb_build_object('method','pickup','fullName',p_full_name,'phone',p_phone)
    else jsonb_build_object('method','delivery','fullName',p_full_name,'phone',p_phone,
         'street',p_street,'landmark',p_landmark,
         'zone',(select name from public.delivery_zones where id = p_zone_id)) end;

  insert into public.orders (
    user_id, items, subtotal, delivery_fee, total, delivery_method, delivery_address,
    payment_method, bank_reference, payment_proof_url, customer_note,
    points_redeemed, points_discount
  ) values (
    uid, validated, subtotal, fee, greatest(0, subtotal + fee - discount), p_delivery_method, addr,
    p_payment_method,
    case when p_payment_method = 'bank_transfer' then p_bank_reference else null end,
    case when p_payment_method = 'bank_transfer' then p_payment_proof_url else null end,
    nullif(trim(coalesce(p_note,'')), ''),
    points_used, discount
  ) returning * into new_order;

  if points_used > 0 then
    perform public.award_points(uid, -points_used, 'redeem', new_order.id);
  end if;

  return jsonb_build_object(
    'id', new_order.id, 'order_number', new_order.order_number,
    'total', new_order.total, 'points_redeemed', points_used, 'points_discount', discount
  );
end;$fn$;
grant execute on function public.place_order(jsonb,text,text,text,uuid,text,integer,text,text,text,text,text) to authenticated;
