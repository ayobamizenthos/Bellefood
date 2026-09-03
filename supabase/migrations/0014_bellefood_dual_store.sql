alter table products add column if not exists store text not null default 'restaurant';
alter table categories add column if not exists store text not null default 'restaurant';
create index if not exists products_store_idx on products (store);
create index if not exists categories_store_idx on categories (store);

delete from products;
delete from categories;

insert into categories (slug, label, store, sort_order, is_active) values
  ('rice', 'Rice Dishes', 'restaurant', 1, true),
  ('swallow', 'Swallow & Soups', 'restaurant', 2, true),
  ('proteins', 'Proteins & Sides', 'restaurant', 3, true),
  ('pasta', 'Pasta & Yam', 'restaurant', 4, true),
  ('combos', 'Combo Meals', 'restaurant', 5, true),
  ('small-chops', 'Small Chops & Grills', 'restaurant', 6, true),
  ('breakfast', 'Breakfast', 'restaurant', 7, true),
  ('drinks', 'Drinks', 'restaurant', 8, true),
  ('provisions', 'Provisions & Cereals', 'supermarket', 20, true),
  ('beverages', 'Drinks & Beverages', 'supermarket', 21, true),
  ('snacks', 'Snacks & Biscuits', 'supermarket', 22, true),
  ('foodstuff', 'Foodstuff & Staples', 'supermarket', 23, true),
  ('cooking', 'Cooking Essentials', 'supermarket', 24, true),
  ('dairy-eggs', 'Dairy & Eggs', 'supermarket', 25, true),
  ('frozen', 'Frozen & Protein', 'supermarket', 26, true),
  ('toiletries', 'Toiletries & Care', 'supermarket', 27, true),
  ('haircare', 'Hair & Beauty', 'supermarket', 28, true),
  ('household', 'Household & Cleaning', 'supermarket', 29, true),
  ('baby', 'Baby Care', 'supermarket', 30, true),
  ('smoking', 'Smoking & Lifestyle', 'supermarket', 31, true);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee numeric(10, 2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table delivery_zones enable row level security;

drop policy if exists zones_read on delivery_zones;
create policy zones_read on delivery_zones for select using (true);

drop policy if exists zones_admin_all on delivery_zones;
create policy zones_admin_all on delivery_zones for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

insert into delivery_zones (name, fee, sort_order) values
  ('Ikota / Chevron', 1000, 1),
  ('Lekki Phase 1', 1500, 2),
  ('Chevron / Orchid', 1500, 3),
  ('Ajah / Sangotedo', 2000, 4),
  ('Victoria Island', 2500, 5),
  ('Ikoyi', 3000, 6),
  ('Mainland (Yaba / Surulere)', 4000, 7);

update store_settings set
  bank_account_name = 'Belle Food',
  bank_name = 'Moniepoint',
  bank_account_number = '0000000000',
  whatsapp_number = '2349137421838',
  support_email = 'hello@bellefood.ng',
  free_delivery_threshold = 100000,
  standard_delivery_fee = 1500,
  express_delivery_fee = 2500,
  installation_fee = 0;

alter publication supabase_realtime add table delivery_zones;
