create sequence if not exists order_number_seq start 1001;

alter table orders alter column order_number set default
  'ZEN-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 5, '0');
