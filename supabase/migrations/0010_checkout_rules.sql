-- An order that points pay for in full has nothing to charge, so place_order settles it on the
-- spot instead of leaving it pending forever. Order numbers carry the Lagos date rather than UTC,
-- saved addresses remember the delivery zone by id, and loyalty settings reject values that
-- would break checkout maths.
alter table public.orders
  alter column order_number set default (
    'BF-' || to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 5, '0')
  );

alter table public.user_addresses
  add column if not exists zone_id uuid references public.delivery_zones(id) on delete set null;

update public.user_addresses address
   set zone_id = zone.id
  from public.delivery_zones zone
 where address.zone_id is null and address.city = zone.name;

alter table public.loyalty_settings drop constraint if exists loyalty_settings_values_valid;
alter table public.loyalty_settings add constraint loyalty_settings_values_valid check (
  naira_per_point > 0 and earn_per_order >= 0 and earn_per_referral >= 0 and welcome_bonus >= 0
);

alter table public.store_settings drop constraint if exists store_settings_threshold_nonneg;
alter table public.store_settings add constraint store_settings_threshold_nonneg
  check (free_delivery_threshold >= 0);

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
  zone_name text;
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
      'kind','product','productId',prod.id,'name',prod.name,'image',prod.images[1],
      'category',prod.category,'isCombo',prod.is_combo,'store',prod.store,
      'unitPrice',prod.price,'quantity',qty
    );
  end loop;

  if p_delivery_method = 'delivery' then
    select fee, name into zone_fee, zone_name from public.delivery_zones where id = p_zone_id and is_active;
    if zone_fee is null then raise exception 'invalid delivery area'; end if;
    select free_delivery_threshold into threshold from public.store_settings limit 1;
    if threshold is not null and subtotal >= threshold then zone_fee := 0; end if;
  else
    zone_fee := 0;
  end if;

  -- points pay only for kitchen food and delivery, never groceries
  want_points := greatest(0, coalesce(p_points, 0));
  if want_points > 0 then
    select points into balance from public.profiles where id = uid for update;
    balance := coalesce(balance, 0);
    if want_points > balance then want_points := balance; end if;
    eligible := kitchen_subtotal + zone_fee;
    discount := least(want_points * s.naira_per_point, eligible);
    points_used := ceil(discount / s.naira_per_point)::int;
    if points_used > balance then points_used := balance; end if;
    discount := least(points_used * s.naira_per_point, eligible);
  end if;

  addr := case when p_delivery_method = 'pickup'
    then jsonb_build_object('method','pickup','fullName',p_full_name,'phone',p_phone)
    else jsonb_build_object('method','delivery','fullName',p_full_name,'phone',p_phone,
         'street',p_street,'landmark',p_landmark,'zone',zone_name,'zoneId',p_zone_id) end;

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

  if new_order.total = 0 then
    update public.orders
       set payment_status = 'verified', status = 'processing', payment_method = 'points',
           bank_reference = null, payment_proof_url = null
     where id = new_order.id
    returning * into new_order;
  end if;

  return jsonb_build_object(
    'id', new_order.id, 'order_number', new_order.order_number,
    'total', new_order.total, 'payment_status', new_order.payment_status,
    'points_redeemed', points_used, 'points_discount', discount
  );
end;
$function$;

create or replace function public.on_order_created()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare
  admin_id uuid;
begin
  insert into notifications (user_id, order_id, type, title, message)
  values (
    new.user_id, new.id, 'new_order', 'Order placed',
    case when new.total = 0
      then 'Your order ' || new.order_number || ' has been placed and paid with your points.'
      else 'Your order ' || new.order_number || ' has been placed. We will confirm your payment shortly.'
    end
  );

  for admin_id in select id from profiles where is_admin loop
    insert into notifications (user_id, order_id, type, title, message)
    values (
      admin_id, new.id, 'new_order', 'New order received',
      new.order_number || ' placed for ' || to_char(new.total, 'FM999,999,999') || ' naira.'
    );
  end loop;
  return new;
end;$fn$;
