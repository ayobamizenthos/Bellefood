-- A new enum value cannot be used in the transaction that adds it, so these ship alone.
alter type public.order_status add value if not exists 'cancelled';
alter type public.notification_type add value if not exists 'cancelled';
