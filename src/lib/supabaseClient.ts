import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'jobpilot-web',
    },
  },
  db: {
    schema: 'public',
  },
  // Reduce realtime overhead — we don't use realtime subscriptions
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});