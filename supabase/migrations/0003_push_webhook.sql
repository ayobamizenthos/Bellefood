create extension if not exists pg_net;

create or replace function notify_push_on_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://xxbecnvdtvbopmuuxswf.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

create trigger notifications_push_delivery
  after insert on notifications
  for each row execute function notify_push_on_insert();
