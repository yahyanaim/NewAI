-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NUCLEAR OPTION (Run this ONLY if "Could not find table in schema cache" persists)
/* 
DROP TABLE IF EXISTS public.user_favorites CASCADE;
CREATE TABLE public.user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  event_title TEXT,
  event_data JSONB,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
*/

-- Create user_favorites table if not exists with all required columns
CREATE TABLE IF NOT EXISTS user_favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id TEXT NOT NULL,
  event_title TEXT,
  event_data JSONB,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns and constraints exist for existing tables
DO $$ 
BEGIN 
    -- Add rating column if it's missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_favorites' AND column_name='rating') THEN
        ALTER TABLE user_favorites ADD COLUMN rating INTEGER;
    END IF;

    -- Add UNIQUE constraint if it's missing (helps avoid duplicates)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_user_id_event_id_key') THEN
        ALTER TABLE user_favorites ADD CONSTRAINT user_favorites_user_id_event_id_key UNIQUE (user_id, event_id);
    END IF;
END $$;

-- FORCE SCHEMA CACHE RELOAD (Fixes "Could not find the table in schema cache" / PGRST205)
NOTIFY pgrst, 'reload schema';

-- Ensure the API roles have access to the schema and tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
CREATE POLICY "Users can insert their own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- New policy for UPDATE (required for rating updates)
DROP POLICY IF EXISTS "Users can update their own favorites" ON user_favorites;
CREATE POLICY "Users can update their own favorites"
  ON user_favorites FOR UPDATE
  USING (auth.uid() = user_id);
