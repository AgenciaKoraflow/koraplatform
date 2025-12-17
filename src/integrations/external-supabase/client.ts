import { createClient } from '@supabase/supabase-js';

// External Supabase client using the user's own project
const EXTERNAL_SUPABASE_URL = 'https://jucejqnalymzeegjieyh.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1Y2VqcW5hbHltemVlZ2ppZXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NjYxNTQsImV4cCI6MjA4MTA0MjE1NH0.eSmL11PH-l82AlAsLjjWjFKndX4L05a2scfHx-jafTo';

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

export { EXTERNAL_SUPABASE_URL };
