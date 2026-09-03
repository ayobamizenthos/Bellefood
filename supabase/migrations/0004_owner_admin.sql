create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, is_admin)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    lower(new.email) = 'zenthosenergies@gmail.com'
  );
  insert into public.carts (user_id) values (new.id);
  insert into public.wishlists (user_id) values (new.id);
  return new;
end;
$$;

update public.profiles p
set is_admin = true
from auth.users u
where p.id = u.id and lower(u.email) = 'zenthosenergies@gmail.com';
