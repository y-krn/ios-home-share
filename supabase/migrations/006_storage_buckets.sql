-- Create screenshots storage bucket
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', true)
on conflict (id) do nothing;

-- Drop existing storage policies if they exist to prevent conflicts
drop policy if exists "screenshots_select_policy" on storage.objects;
drop policy if exists "screenshots_insert_policy" on storage.objects;
drop policy if exists "screenshots_delete_policy" on storage.objects;

-- Create storage access policies (applied on storage.objects table)
create policy "screenshots_select_policy"
  on storage.objects for select
  using ( bucket_id = 'screenshots' );

create policy "screenshots_insert_policy"
  on storage.objects for insert
  with check ( bucket_id = 'screenshots' );

create policy "screenshots_delete_policy"
  on storage.objects for delete
  using ( bucket_id = 'screenshots' );
