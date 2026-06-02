-- Tighten screenshots storage writes/deletes to owner-scoped paths.
--
-- New object paths:
-- - temp/{auth.uid()}/...   for draft uploads and preview originals
-- - posts/{auth.uid()}/...  for finalized public screenshots

drop policy if exists "screenshots_insert_policy" on storage.objects;
drop policy if exists "screenshots_delete_policy" on storage.objects;

create policy "screenshots_insert_own_paths"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] in ('temp', 'posts')
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  );

create policy "screenshots_delete_own_paths"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'screenshots'
    and (storage.foldername(name))[1] in ('temp', 'posts')
    and (storage.foldername(name))[2] = (select auth.uid()::text)
  );
