import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting database setup...');

    // Execute SQL for table creation
    const setupSQL = `
      -- Create user_profiles table
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL,
        display_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create user_favorites table
      CREATE TABLE IF NOT EXISTS user_favorites (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        event_id TEXT NOT NULL,
        event_title TEXT,
        event_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
      CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

      -- Enable Row Level Security
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if any
      DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
      DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
      DROP POLICY IF EXISTS "Users can insert their own favorites" ON user_favorites;
      DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;

      -- RLS Policies for user_profiles
      CREATE POLICY "Users can view their own profile"
        ON user_profiles FOR SELECT
        USING (auth.uid() = id);

      CREATE POLICY "Users can update their own profile"
        ON user_profiles FOR UPDATE
        USING (auth.uid() = id);

      CREATE POLICY "Users can insert their own profile"
        ON user_profiles FOR INSERT
        WITH CHECK (auth.uid() = id);

      -- RLS Policies for user_favorites
      CREATE POLICY "Users can view their own favorites"
        ON user_favorites FOR SELECT
        USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own favorites"
        ON user_favorites FOR INSERT
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own favorites"
        ON user_favorites FOR DELETE
        USING (auth.uid() = user_id);
    `;

    // Execute using RPC call (safer than direct SQL)
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL });

    if (error) {
      // If RPC doesn't exist, try creating tables one by one
      console.log('RPC method not available, creating tables individually...');
      
      // Create user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (profileError && profileError.code === '42P01') {
        console.log('user_profiles table does not exist, needs manual creation');
      }

      // Create user_favorites table  
      const { error: favError } = await supabase
        .from('user_favorites')
        .select('id')
        .limit(1);
      
      if (favError && favError.code === '42P01') {
        console.log('user_favorites table does not exist, needs manual creation');
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Database setup requires SQL execution. Please run the SQL migration file manually.',
          sql: setupSQL,
          instructions: [
            '1. Go to Supabase Dashboard',
            '2. Navigate to SQL Editor',
            '3. Paste the SQL from the response',
            '4. Execute the query'
          ]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Database setup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database tables and policies created successfully',
        tables: ['user_profiles', 'user_favorites'],
        policies: 6,
        indexes: 3
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error setting up database:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to set up database. Please run SQL migration manually.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
