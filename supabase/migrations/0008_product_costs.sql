-- Cost prices are margin data. Products are readable by anyone with the publishable key, so the
-- cost moves to a table only admins can see.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost numeric(14,2) not null check (cost >= 0),
  updated_at timestamptz not null default now()
);

alter table public.product_costs enable row level security;

drop policy if exists product_costs_admin_all on public.product_costs;
create policy product_costs_admin_all on public.product_costs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.product_costs from anon;

insert into public.product_costs (product_id, cost)
select id, cost from public.products where cost is not null
on conflict (product_id) do nothing;

alter table public.products drop column if exists cost;
