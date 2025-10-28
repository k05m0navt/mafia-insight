import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for server-side operations
 * Uses Next.js cookies for session management
 */
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: unknown) {
        try {
          cookieStore.set(name, value, options as Record<string, unknown>);
        } catch {
          // Cookie can't be set if component is in read-only mode
        }
      },
      remove(name: string, options: unknown) {
        try {
          cookieStore.set(name, '', {
            ...(options as Record<string, unknown>),
            maxAge: 0,
          });
        } catch {
          // Cookie can't be removed if component is in read-only mode
        }
      },
    },
  });
};

/**
 * Create a Supabase client for route handlers
 * Uses synchronous cookie access
 */
export const createRouteHandlerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: unknown) {
        cookieStore.set(name, value, options as Record<string, unknown>);
      },
      remove(name: string, options: unknown) {
        cookieStore.set(name, '', {
          ...(options as Record<string, unknown>),
          maxAge: 0,
        });
      },
    },
  });
};

/**
 * Create a service role client for admin operations on the server
 * WARNING: Only use on the server side
 */
export const createSupabaseServiceRoleClient = () => {
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

/**
 * Create a Supabase admin client
 * Has full access to the database, bypassing Row Level Security
 */
export const createSupabaseAdminClient = () => {
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
