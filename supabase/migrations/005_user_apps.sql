-- user_apps table
create table if not exists user_apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  track_id text not null,
  app_name text not null,
  artwork_url text not null,
  created_at timestamptz default now(),
  unique(user_id, track_id)
);

-- RLS
alter table user_apps enable row level security;

create policy "user_apps_select" on user_apps for select using (true);
create policy "user_apps_insert" on user_apps for insert
  with check (auth.uid() = user_id);
create policy "user_apps_delete" on user_apps for delete
  using (auth.uid() = user_id);

-- Indices for performance
create index if not exists user_apps_user_id_idx on user_apps(user_id);
create index if not exists user_apps_track_id_idx on user_apps(track_id);
