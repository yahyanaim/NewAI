-- Migration: enable_realtime_moroccan_news
-- Created at: 1762182129

-- Enable Row Level Security
ALTER TABLE moroccan_news_articles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to news
CREATE POLICY "Allow public read access" ON moroccan_news_articles
  FOR SELECT
  USING (true);

-- Allow insert/update via edge function (both anon and service_role)
CREATE POLICY "Allow edge function writes" ON moroccan_news_articles
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Allow edge function updates" ON moroccan_news_articles
  FOR UPDATE
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE moroccan_news_articles;

-- Create index for faster queries
CREATE INDEX idx_moroccan_news_pub_date ON moroccan_news_articles(pub_date DESC);
CREATE INDEX idx_moroccan_news_created_at ON moroccan_news_articles(created_at DESC);;