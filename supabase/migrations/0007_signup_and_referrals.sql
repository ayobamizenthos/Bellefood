-- Admin rights are granted by hand, never inferred from the email address a stranger signs up with.
-- The welcome bonus in loyalty settings is now actually paid out, and the unused server-side cart
-- and wishlist tables go (both live on the device).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $fn$
declare
  v_username text := lower(nullif(trim(new.raw_user_meta_data->>'username'), ''));
  v_ref text := lower(nullif(trim(new.raw_user_meta_data->>'referral'), ''));
  v_referrer uuid;
  v_welcome integer;
begin
  if v_username is not null and v_username !~ '^[a-z0-9_]{3,20}$' then v_username := null; end if;
  if v_username is not null and exists (select 1 from public.profiles where username = v_username::citext) then
    v_username := null;
  end if;
  if v_ref is not null then select id into v_referrer from public.profiles where username = v_ref::citext; end if;

  insert into public.profiles (id, full_name, phone, username, referred_by)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', v_username, v_referrer);

  select welcome_bonus into v_welcome from public.loyalty_settings where id;
  if v_welcome > 0 then
    perform public.award_points(new.id, v_welcome, 'welcome', null);
  end if;
  return new;
end;$fn$;

drop table if exists public.carts;
drop table if exists public.wishlists;

create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $fn$
  select lower(trim(p_username)) ~ '^[a-z0-9_]{3,20}$'
     and not exists (select 1 from public.profiles where username = lower(trim(p_username))::citext);
$fn$;
revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Customers cannot read other profiles, so counting the people they invited has to happen here.
create or replace function public.referral_count()
returns integer language sql stable security definer set search_path = public as $fn$
  select count(*)::integer from public.profiles where referred_by = auth.uid();
$fn$;
revoke execute on function public.referral_count() from public, anon;
grant execute on function public.referral_count() to authenticated;

create index if not exists profiles_referred_by_idx on public.profiles (referred_by);
