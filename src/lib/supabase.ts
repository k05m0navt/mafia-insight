import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side operations
export const createServerClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Client for middleware operations
export const createMiddlewareClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
