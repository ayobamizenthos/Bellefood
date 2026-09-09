-- Alert admins (push + in-app) when a customer confirms receipt / pickup,
-- which now moves the order straight to "completed".
create or replace function public.on_order_status_change()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  notif_type notification_type;
  notif_title text;
  notif_message text;
  admin_id uuid;
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
    if new.status = 'completed' and new.receipt_confirmed then
      for admin_id in select id from profiles where is_admin loop
        insert into notifications (user_id, order_id, type, title, message)
        values (admin_id, new.id, 'completed', 'Customer confirmed receipt', new.order_number || ' was confirmed received by the customer.');
      end loop;
    end if;
  end if;
  return new;
end;
$function$;
