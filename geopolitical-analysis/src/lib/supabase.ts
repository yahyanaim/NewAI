import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = "https://srfupvmngvyzvfudjxqk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZnVwdm1uZ3Z5enZmdWRqeHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzMxMDUsImV4cCI6MjA3Nzc0OTEwNX0.gdamTOrI6gGk30PbOBStXmpEQI6gFrw4W5MRBARJFbs";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface DBMoroccanNewsArticle {
  id: number;
  title: string;
  link: string;
  pub_date: string;
  description: string | null;
  content: string | null;
  source: string;
  category: string | null;
  guid: string | null;
  sentiment: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
}
