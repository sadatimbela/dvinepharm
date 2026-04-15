import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ziiaifbcmeaummjoxych.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaWFpZmJjbWVhdW1tam94eWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgzMjIsImV4cCI6MjA5MTY2NDMyMn0.dm_giP8_waZ3LSXBHOtGJCwRSR0sgYTof-vc06mCeFc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
