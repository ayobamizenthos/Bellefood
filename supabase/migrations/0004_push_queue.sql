-- Push delivery becomes a queue instead of a single shot.
--
-- Until now every notification got exactly one attempt. The trigger called the
-- sender, and if that call failed the alert was simply gone: an order placed
-- while the kitchen's phone was off never arrived, and nothing retried it.
--
-- A row with no pushed_at has not reached anyone yet. That is the entire queue.
-- The sender stamps rows as it delivers them, so a failed run leaves them
-- outstanding and the next run picks them up.

alter table public.notifications
  add column if not exists pushed_at timestamptz;

-- Everything written before this migration has already been delivered under the
-- old one-shot scheme. Leaving it null would hand the whole backlog to every
-- customer the first time the new sender runs.
update public.notifications
  set pushed_at = created_at
  where pushed_at is null;

create index if not exists notifications_push_pending_idx
  on public.notifications(created_at)
  where pushed_at is null;

CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- A push that cannot be sent must not take the transaction that raised it
  -- down as well. Unguarded, a sender that is slow or unreachable rolls back
  -- the order the customer just placed.
  begin
    perform net.http_post(
      url := 'https://wpanjjgxrbyrieirutpl.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYW5qamd4cmJ5cmllaXJ1dHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4NDE4MDIsImV4cCI6MjEwMzQxNzgwMn0.P-OqtTxhjA61Iat0NaQj50hVYX9h2gERfwmrL57bU1A'),
      body := '{}'::jsonb
    );
  exception when others then
    -- the row keeps its null pushed_at and the next run collects it
    null;
  end;
  return new;
end;
$function$;
