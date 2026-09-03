alter table products add column if not exists in_stock boolean not null default true;

update products set in_stock = true;
update products set stock = greatest(stock, 25) where stock < 25;

update products
set name = 'Solar DC Cable',
    description = 'UV-resistant, double-insulated single-core DC cable for panel and battery wiring. Priced per yard. Choose gauge and enter the length you need.'
where slug = 'solar-cable-single-core';

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images public read" on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "product images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
