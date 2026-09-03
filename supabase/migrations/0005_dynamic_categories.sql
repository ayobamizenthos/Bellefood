create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into categories (slug, label, sort_order) values
  ('solar-batteries', 'Solar Batteries', 1),
  ('inverters', 'Inverters', 2),
  ('solar-panels', 'Solar Panels', 3),
  ('powertanks', 'PowerTanks', 4),
  ('solar-cables', 'Solar Cables', 5);

alter table products alter column category type text using category::text;
drop type if exists product_category;

alter table categories enable row level security;
create policy categories_public_read on categories for select using (true);
create policy categories_admin_write on categories for all
  using (is_admin()) with check (is_admin());
