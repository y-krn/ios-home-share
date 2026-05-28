-- Migration to optimize posts_by_track_id by avoiding regex full table scans.
-- Extracted track_ids are saved directly into the extracted_tags JSONB under the 'track_ids' key.

-- 1. Migrate existing posts data to populate 'track_ids' array in extracted_tags
UPDATE posts
SET extracted_tags = jsonb_set(
  extracted_tags,
  '{track_ids}',
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT track_id)
      FROM (
        SELECT substring(v->>'url' from '/id([0-9]+)') AS track_id
        FROM jsonb_each(COALESCE(posts.extracted_tags->'app_links', '{}'::jsonb)) e(k, v)
        UNION
        SELECT substring(v->>'url' from '/id([0-9]+)') AS track_id
        FROM jsonb_each(COALESCE(posts.extracted_tags->'widget_links', '{}'::jsonb)) e(k, v)
      ) t
      WHERE track_id IS NOT NULL
    ),
    '[]'::jsonb
  )
);

-- 2. Re-define posts_by_track_id to query 'track_ids' array using GIN index
CREATE OR REPLACE FUNCTION posts_by_track_id(track_id text)
RETURNS SETOF posts LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT DISTINCT ON (id, created_at) p.*
  from posts p
  where p.extracted_tags @> jsonb_build_object('track_ids', jsonb_build_array(track_id))
  order by created_at desc, id;
$$;
