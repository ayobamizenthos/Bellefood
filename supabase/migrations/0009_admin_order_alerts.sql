create or replace function on_order_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  admin_id uuid;
begin
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
$$;

create trigger orders_created_notify
  after insert on orders
  for each row execute function on_order_created();
