-- LEOGO PRODUCT IMAGE STORAGE
-- Run this once in Supabase SQL Editor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

-- Sellers may upload only into their own folder: seller UUID / filename
create policy "Active sellers can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.sellers s
    where s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
      and (storage.foldername(name))[1] = s.id::text
  )
);

create policy "Active sellers can update their product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.sellers s
    where s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
      and (storage.foldername(name))[1] = s.id::text
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.sellers s
    where s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
      and (storage.foldername(name))[1] = s.id::text
  )
);

create policy "Active sellers can delete their product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.sellers s
    where s.auth_user_id = auth.uid()
      and lower(coalesce(s.status,'')) = 'active'
      and (storage.foldername(name))[1] = s.id::text
  )
);
