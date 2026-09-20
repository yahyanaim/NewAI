# Manual Database Setup Instructions

Since the Supabase access token is expired, please follow these steps to create the database tables manually:

## Option 1: Using Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/srfupvmngvyzvfudjxqk

2. Click on "SQL Editor" in the left sidebar

3. Click "New Query"

4. Copy and paste the entire contents of `/workspace/geopolitical-analysis/database_setup.sql`

5. Click "Run" to execute the query

6. Verify tables created:
   - Navigate to "Table Editor"
   - You should see `user_profiles` and `user_favorites` tables

## Option 2: Using psql Command Line

If you have database connection string:

```bash
psql "postgresql://postgres:[PASSWORD]@db.srfupvmngvyzvfudjxqk.supabase.co:5432/postgres" < database_setup.sql
```

## Option 3: Using Supabase CLI

```bash
supabase db push
```

## Verification

After creating the tables, verify with:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_favorites');

-- Check RLS is enabled
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_favorites');

-- Test insert (will only work when authenticated)
SELECT * FROM user_favorites LIMIT 1;
```

## What Gets Created

### Tables
1. **user_profiles**
   - id (UUID, Primary Key)
   - email (TEXT)
   - display_name (TEXT)
   - created_at, updated_at (TIMESTAMPTZ)

2. **user_favorites**
   - id (BIGSERIAL, Primary Key)  
   - user_id (UUID)
   - event_id (TEXT)
   - event_title (TEXT)
   - event_data (JSONB)
   - created_at (TIMESTAMPTZ)

### Indexes
- idx_user_favorites_user_id
- idx_user_favorites_event_id
- idx_user_favorites_created_at

### RLS Policies
- Users can view/update/insert their own profile
- Users can view/insert/delete their own favorites
- All enforced with `auth.uid() = user_id` check

## After Setup

Once tables are created, test the application:
1. Visit: https://kp8sc44ktv73.space.minimax.io
2. Register a new account
3. Add favorites
4. Verify they persist across page refreshes
5. Sign out and back in
6. Favorites should still be there

## Troubleshooting

**Error: relation "user_profiles" does not exist**
- Tables not created yet, run SQL migration

**Error: permission denied**
- RLS policies not set up correctly
- Re-run the policy creation part of SQL

**Error: duplicate key value**
- Trying to create duplicate favorite
- This is expected, favoriting again should remove it

## Need Help?

Check the full testing plan: `/workspace/geopolitical-analysis/E2E_TESTING_PLAN.md`
