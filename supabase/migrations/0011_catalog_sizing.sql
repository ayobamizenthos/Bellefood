alter table products add column if not exists capacity_kwh numeric(8, 2);
alter table products add column if not exists power_kva numeric(8, 2);
alter table products add column if not exists wattage integer;

delete from products where slug in ('felicity-3-5kva-inverter', 'inverex-nitrox-6-2kw', 'canadian-solar-550w-mono');

update products
set name = 'Jinko 500W Mono Panel',
    slug = 'jinko-500w-mono',
    price = 150000,
    wattage = 500,
    specs = '{"wattage":"500W","cellType":"Monocrystalline PERC","efficiency":"21.0%","warranty":"12 years product / 25 years performance"}'
where slug = 'jinko-450w-mono';

update products
set name = 'itel Power Tank 1kWh',
    slug = 'itel-power-tank-1kwh',
    brand = 'itel',
    price = 360000,
    capacity_kwh = 1.0,
    power_kva = 0.5,
    description = 'All-in-one solar power station with a 500W pure sine wave inverter and 1kWh LiFePO4 battery. Charges from solar or the wall, silent and safe for indoor use.',
    specs = '{"inverter":"500W pure sine wave","battery":"1000Wh LiFePO4","cycles":"6000+","charging":"Solar + AC","warranty":"24 months"}'
where slug = 'itl-powertank-5-12kwh';


insert into products (name, slug, sku, category, brand, price, cost, stock, in_stock, description, specs, images, rating, featured, wattage)
values
  ('400W Monocrystalline Solar Panel', '400w-mono-panel', 'PAN-400', 'solar-panels', 'Generic',
   120000, 96000, 40, true,
   'Efficient 400W monocrystalline panel, ideal for small and mid-size solar systems.',
   '{"wattage":"400W","cellType":"Monocrystalline","efficiency":"20.5%","warranty":"12 years product / 25 years performance"}',
   '{}', 4.6, false, 400)
on conflict (slug) do nothing;

insert into products (name, slug, sku, category, brand, price, cost, stock, in_stock, description, specs, images, rating, featured, power_kva)
values
  ('HAISIC 1.5kVA Hybrid Inverter', 'haisic-1-5kva-inverter', 'INV-HAI-15', 'inverters', 'HAISIC',
   140000, 112000, 20, true,
   'Compact 1.5kVA (12V) hybrid inverter with built-in MPPT solar charger and pure sine wave output.',
   '{"power":"1.5kVA","voltage":"12V","output":"Pure sine wave","charger":"Built-in MPPT","efficiency":">90%","warranty":"24 months"}',
   '{}', 4.7, false, 1.5),
  ('HAISIC 4.2kVA Hybrid Inverter', 'haisic-4-2kva-inverter', 'INV-HAI-42', 'inverters', 'HAISIC',
   320000, 264000, 14, true,
   '4.2kVA (24V) hybrid inverter with built-in MPPT, pure sine wave output and solar plus grid charging.',
   '{"power":"4.2kVA / 3360W","voltage":"24V","output":"Pure sine wave","charger":"Built-in MPPT","efficiency":">90%","warranty":"24 months"}',
   '{}', 4.8, true, 4.2)
on conflict (slug) do nothing;

insert into products (name, slug, sku, category, brand, price, cost, stock, in_stock, description, specs, images, rating, featured, capacity_kwh)
values
  ('HAISIC 2.4kWh Lithium Battery', 'haisic-2-4kwh-battery', 'BAT-HAI-24', 'solar-batteries', 'HAISIC',
   300000, 245000, 16, true,
   '2.4kWh 24V 100Ah LiFePO4 battery with intelligent BMS and 6000+ deep-cycle life.',
   '{"capacity":"2.4kWh","voltage":"24V","amps":"100Ah","chemistry":"LiFePO4","cycles":"6000+","warranty":"60 months"}',
   '{}', 4.8, false, 2.4)
on conflict (slug) do nothing;
