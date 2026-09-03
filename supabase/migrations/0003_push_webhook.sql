create extension if not exists pg_net;

create or replace function notify_push_on_insert()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://wpanjjgxrbyrieirutpl.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYW5qamd4cmJ5cmllaXJ1dHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDE4MDIsImV4cCI6MjEwMzQxNzgwMn0.P-OqtTxhjA61Iat0NaQj50hVYX9h2gERfwmrL57bU1A'
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

create trigger notifications_push_delivery
  after insert on notifications
  for each row execute function notify_push_on_insert();
