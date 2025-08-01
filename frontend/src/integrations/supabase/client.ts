// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://khreqfrcnolvtnydcqoo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtocmVxZnJjbm9sdnRueWRjcW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODcwMzksImV4cCI6MjA2ODU2MzAzOX0.AOA8CB-m-XW4NHItWCaXIYPo1QqS9pH1gEY0seVKT6w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});