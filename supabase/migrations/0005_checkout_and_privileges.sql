-- Checkout that works for delivery, and no way to pay for food with made-up points.
--
-- place_order declared a variable with the same name as the delivery_zones
-- column it read, so every delivery order failed as ambiguous. It now also
-- refuses switched-off zones, out-of-stock items, oversized text and receipts
-- the customer did not upload.
--
-- Postgres grants execute on new functions to public. award_points took any
-- user and any amount, so anyone with the publishable key could mint points.
-- Trigger and helper functions lose that grant; the two calls customers make
-- stay open to signed-in users only.

create or replace function public.place_order(p_items jsonb, p_delivery_method text, p_full_name text, p_phone text, p_zone_id uuid DEFAULT NULL::uuid, p_payment_method text DEFAULT 'paystack'::text, p_points integer DEFAULT 0, p_street text DEFAULT NULL::text, p_landmark text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_bank_reference text DEFAULT NULL::text, p_payment_proof_url text DEFAULT NULL::text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  uid uuid := auth.uid();
  s public.loyalty_settings;
  item jsonb;
  prod record;
  qty integer;
  subtotal numeric := 0;
  kitchen_subtotal numeric := 0;
  zone_fee numeric := 0;
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
  if jsonb_array_length(p_items) > 60 then raise exception 'too many items'; end if;
  if length(coalesce(p_full_name, '')) not between 2 and 80
     or length(coalesce(p_phone, '')) not between 7 and 20
     or length(coalesce(p_street, '')) > 200
     or length(coalesce(p_landmark, '')) > 120
     or length(coalesce(p_note, '')) > 500
     or length(coalesce(p_bank_reference, '')) > 80 then
    raise exception 'check your details';
  end if;
  -- a receipt can only be one the customer uploaded themselves
  if p_payment_proof_url is not null and p_payment_proof_url not like uid::text || '/%' then
    raise exception 'invalid receipt';
  end if;

  select * into s from public.loyalty_settings where id;

  for item in select * from jsonb_array_elements(p_items) loop
    qty := coalesce((item->>'quantity')::int, 0);
    if qty < 1 or qty > 99 then raise exception 'bad quantity'; end if;
    select id, name, price, store, category, is_combo, images, is_published, in_stock
      into prod from public.products where id = (item->>'product_id')::uuid;
    if prod.id is null or not prod.is_published or not prod.in_stock then raise exception 'item unavailable'; end if;
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
    select fee into zone_fee from public.delivery_zones where id = p_zone_id and is_active;
    if zone_fee is null then raise exception 'invalid delivery area'; end if;
    select free_delivery_threshold into threshold from public.store_settings limit 1;
    if threshold is not null and subtotal >= threshold then zone_fee := 0; end if;
  else
    zone_fee := 0;
  end if;

  -- points: pay only for kitchen food + delivery, never groceries
  want_points := greatest(0, coalesce(p_points, 0));
  if want_points > 0 then
    select points into balance from public.profiles where id = uid for update;
    balance := coalesce(balance, 0);
    if want_points > balance then want_points := balance; end if;
    eligible := kitchen_subtotal + zone_fee;
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
    uid, validated, subtotal, zone_fee, greatest(0, subtotal + zone_fee - discount), p_delivery_method, addr,
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
end;
$function$;

revoke execute on function public.award_points(uuid, integer, text, uuid) from public, anon, authenticated;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig, p.proname
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
       and p.proname in ('handle_new_user', 'notify_admins_on_receipt', 'notify_push_on_insert',
                         'on_order_created', 'on_order_paid', 'on_order_status_change',
                         'place_order', 'claim_username')
  loop
    execute format('revoke execute on function %s from public, anon', f.sig);
    if f.proname in ('place_order', 'claim_username') then
      execute format('grant execute on function %s to authenticated', f.sig);
    end if;
  end loop;
end $$;

-- Orders are only ever created by place_order, which prices them itself.
drop policy if exists "orders_owner_insert" on public.orders;
revoke insert, delete, truncate on public.orders from anon, authenticated;

-- A customer can confirm receipt only of a paid order that is on its way.
create or replace function public.guard_order_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_trusted_writer() or public.is_admin() then return new; end if;
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
  if not (old.receipt_confirmed = false and new.receipt_confirmed = true
          and old.payment_status = 'verified'
          and old.status in ('out_for_delivery', 'delivered')) then
    new.receipt_confirmed := old.receipt_confirmed;
  end if;
  if new.status is distinct from old.status
     and not (new.status = 'completed' and new.receipt_confirmed = true) then
    new.status := old.status;
  end if;
  return new;
end;
$$;

-- Customers may only mark their notifications read.
revoke update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;

-- One Paystack reference pays for one order.
create unique index if not exists orders_payment_reference_key
  on public.orders (payment_reference) where payment_reference is not null;
