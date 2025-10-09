import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Du behöver ersätta dessa med dina riktiga Supabase-uppgifter
// Hämta från Supabase Dashboard → Settings → API
const supabaseUrl = 'https://rfpjadpegpcflhhcfydz.supabase.co'; // t.ex. 'https://xxxxx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcGphZHBlZ3BjZmxoaGNmeWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODkyODQsImV4cCI6MjA3NTU2NTI4NH0.CgOEhgQJvfXRv0baGSeAl675Xt7ei1y2SEjP0UGk-uM'; // Den långa anon/public nyckeln

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;