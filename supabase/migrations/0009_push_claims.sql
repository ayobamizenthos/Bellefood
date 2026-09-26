-- Two sender runs overlapping (every insert triggers one) could both pick up the same rows and
-- push them twice. A run now claims its rows first; a claim older than two minutes belongs to a
-- run that died, so the rows are fair game again.
alter table public.notifications
  add column if not exists push_claimed_at timestamptz;

create or replace function public.claim_push_batch(p_limit integer)
returns setof public.notifications
language sql security definer set search_path = public as $fn$
  update public.notifications
     set push_claimed_at = now()
   where id in (
     select id from public.notifications
      where pushed_at is null
        and (push_claimed_at is null or push_claimed_at < now() - interval '2 minutes')
      order by created_at
      limit p_limit
      for update skip locked
   )
  returning *;
$fn$;
revoke execute on function public.claim_push_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_push_batch(integer) to service_role;
