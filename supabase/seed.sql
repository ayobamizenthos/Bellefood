insert into products (name, slug, sku, category, brand, price, cost, stock, in_stock, description, specs, images, rating, featured, capacity_kwh, power_kva, wattage, cable_pricing)
values
  ('HAISIC 1.5kVA Hybrid Inverter', 'haisic-1-5kva-inverter', 'INV-HAI-15',
   'inverters', 'HAISIC', 160000, 130000, 20, true,
   'Compact 1.5kVA (12V) hybrid inverter with built-in MPPT solar charger and pure sine wave output.',
   '{"power":"1.5kVA","voltage":"12V","output":"Pure sine wave","charger":"Built-in MPPT","efficiency":">90%","warranty":"24 months"}',
   '{}', 4.7, false, null, 1.5, null, null),

  ('HAISIC 4.2kVA Hybrid Inverter', 'haisic-4-2kva-inverter', 'INV-HAI-42',
   'inverters', 'HAISIC', 350000, 300000, 14, true,
   '4.2kVA (24V) hybrid inverter with built-in MPPT, pure sine wave output and solar plus grid charging.',
   '{"power":"4.2kVA / 3360W","voltage":"24V","output":"Pure sine wave","charger":"Built-in MPPT","efficiency":">90%","warranty":"24 months"}',
   '{}', 4.8, true, null, 4.2, null, null),

  ('HAISIC 2.4kWh Lithium Battery', 'haisic-2-4kwh-battery', 'BAT-HAI-24',
   'solar-batteries', 'HAISIC', 320000, 265000, 16, true,
   '2.4kWh 24V 100Ah LiFePO4 battery with intelligent BMS and 6000+ deep-cycle life.',
   '{"capacity":"2.4kWh","voltage":"24V","amps":"100Ah","chemistry":"LiFePO4","cycles":"6000+","warranty":"60 months"}',
   '{}', 4.8, false, 2.4, null, null, null),

  ('Jinko 500W Mono Panel', 'jinko-500w-mono', 'PAN-JIN-500',
   'solar-panels', 'Jinko Solar', 150000, 120000, 45, true,
   'High-efficiency 500W monocrystalline PERC panel with strong low-light performance.',
   '{"wattage":"500W","cellType":"Monocrystalline PERC","efficiency":"21.0%","warranty":"12 years product / 25 years performance"}',
   '{}', 4.7, false, null, null, 500, null),

  ('400W Monocrystalline Solar Panel', '400w-mono-panel', 'PAN-400',
   'solar-panels', 'Generic', 120000, 96000, 40, true,
   'Efficient 400W monocrystalline panel, ideal for small and mid-size solar systems.',
   '{"wattage":"400W","cellType":"Monocrystalline","efficiency":"20.5%","warranty":"12 years product / 25 years performance"}',
   '{}', 4.6, false, null, null, 400, null),

  ('Solar DC Cable', 'solar-cable-single-core', 'CAB-DC-001',
   'solar-cables', 'Generic', 2000, 1400, 100, true,
   'UV-resistant, double-insulated single-core DC cable for panel and battery wiring. Priced per yard. Choose gauge and enter the length you need.',
   '{"insulation":"XLPE double insulated","rating":"1500V DC","temperature":"-40C to 90C"}',
   '{}', 4.4, false, null, null, null, '{"4mm":2000,"6mm":4500}')
on conflict (slug) do nothing;
