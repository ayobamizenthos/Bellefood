-- Status alerts read correctly for pickup orders, a confirmed payment sends one alert instead of
-- two, an order settled with points does not announce a payment check, and cancellations reach
-- the customer with the reason.
create or replace function public.on_order_status_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  is_pickup boolean := new.delivery_method = 'pickup';
  paid_now boolean := new.payment_status = 'verified' and old.payment_status is distinct from 'verified';
  notif_type notification_type;
  notif_title text;
  notif_message text;
  admin_id uuid;
begin
  if paid_now and new.payment_method <> 'points' then
    insert into notifications (user_id, order_id, type, title, message)
    values (new.user_id, new.id, 'payment_verified', 'Payment verified',
            'We''ve confirmed your payment for ' || new.order_number || '. Your order is being prepared.');
  end if;

  if new.status is distinct from old.status then
    insert into order_status_log (order_id, status, admin_notes)
    values (new.id, new.status, case when new.status = 'cancelled' then new.cancel_reason end);

    notif_type := null;
    case new.status
      when 'processing' then
        if not paid_now then
          notif_type := 'processing';
          notif_title := 'Order is being prepared';
          notif_message := 'We''re preparing ' || new.order_number
            || case when is_pickup then ' for pickup.' else ' for delivery.' end;
        end if;
      when 'out_for_delivery' then
        notif_type := 'out_for_delivery';
        if is_pickup then
          notif_title := 'Ready for pickup';
          notif_message := new.order_number || ' is ready to collect at our store.';
        else
          notif_title := 'Out for delivery';
          notif_message := new.order_number || ' is on its way to you.';
        end if;
      when 'delivered' then
        notif_type := 'delivered';
        notif_title := case when is_pickup then 'Picked up' else 'Delivered' end;
        notif_message := new.order_number
          || case when is_pickup then ' has been picked up. Thank you!' else ' has been delivered. Thank you!' end;
      when 'completed' then
        notif_type := 'completed';
        notif_title := 'Order complete';
        notif_message := new.order_number || ' is complete.';
      when 'cancelled' then
        notif_type := 'cancelled';
        notif_title := 'Order cancelled';
        notif_message := new.order_number || ' was cancelled.'
          || coalesce(' ' || rtrim(new.cancel_reason, '.') || '.', '')
          || case when new.points_redeemed > 0 then ' The points you used are back in your balance.' else '' end;
      else
        null;
    end case;

    if notif_type is not null then
      insert into notifications (user_id, order_id, type, title, message)
      values (new.user_id, new.id, notif_type, notif_title, notif_message);
    end if;

    if new.status = 'completed' and new.receipt_confirmed then
      for admin_id in select id from profiles where is_admin loop
        insert into notifications (user_id, order_id, type, title, message)
        values (admin_id, new.id, 'completed', 'Customer confirmed receipt',
                new.order_number || ' was confirmed received by the customer.');
      end loop;
    end if;
  end if;
  return new;
end;
$function$;
