-- Add GIN index to posts.extracted_tags for faster JSONB containing queries
CREATE INDEX IF NOT EXISTS idx_posts_extracted_tags_gin ON posts USING gin (extracted_tags);
