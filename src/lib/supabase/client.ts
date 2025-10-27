import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for client-side operations
 * Uses SSR utilities for cookie-based authentication
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Standard Supabase client for direct operations
 * Use this for operations that don't require SSR
 */
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Create a service role client for admin operations
 * WARNING: Only use on the server side
 */
export const createServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
