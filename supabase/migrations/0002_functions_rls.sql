create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch before update on products
  for each row execute function touch_updated_at();
create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();
create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone');
  insert into public.carts (user_id) values (new.id);
  insert into public.wishlists (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function on_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  notif_type notification_type;
  notif_title text;
  notif_message text;
begin
  if new.payment_status = 'verified' and old.payment_status is distinct from 'verified' then
    insert into notifications (user_id, order_id, type, title, message)
    values (new.user_id, new.id, 'payment_verified',
            'Payment verified',
            'We''ve confirmed your payment for ' || new.order_number || '. Your order is being processed.');
  end if;

  if new.status is distinct from old.status then
    insert into order_status_log (order_id, status) values (new.id, new.status);

    case new.status
      when 'processing' then
        notif_type := 'processing';
        notif_title := 'Order is being processed';
        notif_message := 'We''re preparing ' || new.order_number || ' for delivery.';
      when 'out_for_delivery' then
        notif_type := 'out_for_delivery';
        notif_title := 'Out for delivery';
        notif_message := new.order_number || ' is on its way to you today.';
      when 'delivered' then
        notif_type := 'delivered';
        notif_title := 'Delivered';
        notif_message := new.order_number || ' has been delivered. Thank you!';
      when 'completed' then
        notif_type := 'completed';
        notif_title := 'Order complete';
        notif_message := new.order_number || ' is complete.'
          || case when new.installation_requested then ' Installation done.' else '' end;
      else
        notif_type := null;
    end case;

    if notif_type is not null then
      insert into notifications (user_id, order_id, type, title, message)
      values (new.user_id, new.id, notif_type, notif_title, notif_message);
    end if;
  end if;

  return new;
end;
$$;

create trigger orders_status_change
  after update on orders
  for each row execute function on_order_status_change();

create or replace function on_order_paid()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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
$$;

create trigger orders_paid_stats
  after update on orders
  for each row execute function on_order_paid();

alter table profiles enable row level security;
alter table user_addresses enable row level security;
alter table products enable row level security;
alter table carts enable row level security;
alter table wishlists enable row level security;
alter table orders enable row level security;
alter table order_status_log enable row level security;
alter table notifications enable row level security;
alter table push_subscriptions enable row level security;
alter table store_settings enable row level security;

create policy profiles_self_select on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid());

create policy addresses_owner on user_addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy products_public_read on products for select
  using (is_published or is_admin());
create policy products_admin_write on products for all
  using (is_admin()) with check (is_admin());

create policy carts_owner on carts for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlists_owner on wishlists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy orders_owner_select on orders for select
  using (user_id = auth.uid() or is_admin());
create policy orders_owner_insert on orders for insert
  with check (user_id = auth.uid());
create policy orders_owner_confirm on orders for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_admin_update on orders for update
  using (is_admin()) with check (is_admin());

create policy status_log_read on order_status_log for select
  using (
    is_admin() or exists (
      select 1 from orders o where o.id = order_status_log.order_id and o.user_id = auth.uid()
    )
  );

create policy notifications_owner_select on notifications for select
  using (user_id = auth.uid());
create policy notifications_owner_update on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy push_owner on push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy settings_public_read on store_settings for select using (true);
create policy settings_admin_write on store_settings for update
  using (is_admin()) with check (is_admin());
