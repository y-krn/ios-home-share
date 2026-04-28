create or replace function popular_apps(limit_count int default 12)
returns table(name text, use_count bigint, info jsonb)
language sql stable security definer as $$
  with app_uses as (
    select
      jsonb_array_elements_text(coalesce(extracted_tags->'apps', '[]'::jsonb)) as n,
      extracted_tags->'app_links' as links
    from posts
    union all
    select
      jsonb_array_elements_text(coalesce(extracted_tags->'dock_apps', '[]'::jsonb)) as n,
      extracted_tags->'app_links' as links
    from posts
  ),
  enriched as (
    select
      n,
      links->n as info,
      substring(links->n->>'url' from '/id(\d+)') as track_id
    from app_uses
    where n <> ''
  )
  select
    coalesce(
      (array_agg(info->>'trackName') filter (where info is not null))[1],
      min(n)
    ) as name,
    count(*) as use_count,
    (array_agg(info) filter (where info is not null))[1] as info
  from enriched
  group by coalesce(track_id, n)
  order by count(*) desc
  limit limit_count;
$$;

grant execute on function popular_apps(int) to anon, authenticated;
