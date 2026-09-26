-- Admins can cancel an order (a fake transfer receipt, an item that ran out) and the customer
-- gets back any points spent on it. A paid order also gives back the points it earned and comes
-- off the customer's spend totals; the money itself is refunded outside the app.
alter table public.orders add column if not exists cancel_reason text;

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
  new.cancel_reason := old.cancel_reason;
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

create or replace function public.cancel_order(p_order uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $fn$
declare
  target public.orders;
  earned integer;
  balance integer;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  if length(coalesce(p_reason, '')) > 300 then raise exception 'reason too long'; end if;

  select * into target from public.orders where id = p_order for update;
  if target.id is null then raise exception 'order not found'; end if;
  if target.status in ('completed', 'cancelled') then raise exception 'order can no longer be cancelled'; end if;

  perform set_config('app.privileged', 'on', true);

  update public.orders
     set status = 'cancelled',
         cancel_reason = nullif(trim(coalesce(p_reason, '')), ''),
         payment_status = case when payment_status = 'pending' then 'failed'::payment_status else payment_status end
   where id = target.id;

  if target.points_redeemed > 0 then
    perform public.award_points(target.user_id, target.points_redeemed, 'refund', target.id);
  end if;

  if target.payment_status = 'verified' then
    select coalesce(sum(delta), 0) into earned
      from public.points_ledger
     where order_id = target.id and user_id = target.user_id and reason = 'order';
    select points into balance from public.profiles where id = target.user_id for update;
    earned := least(earned, coalesce(balance, 0));
    if earned > 0 then
      perform public.award_points(target.user_id, -earned, 'cancelled', target.id);
    end if;

    update public.profiles
       set total_orders = greatest(total_orders - 1, 0),
           total_spent = greatest(total_spent - target.total, 0)
     where id = target.user_id;
  end if;
end;$fn$;
revoke execute on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;
