alter table orders add column if not exists payment_proof_url text;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "payment proof upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "payment proof read" on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (owner = auth.uid() or public.is_admin())
  );
