import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const notConfiguredError = { message: 'Supabase is not configured' } as const;

function createSafeClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  // Stub client so the UI never crashes when Supabase env vars are absent.
  // All calls resolve to an error result, letting views show their own
  // error/empty states instead of a blank screen.
  const stub = {
    from: () => ({
      select: () => Promise.resolve({ data: null, error: notConfiguredError }),
      insert: () => Promise.resolve({ data: null, error: notConfiguredError }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
      order: () => ({ limit: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
      limit: () => Promise.resolve({ data: null, error: notConfiguredError }),
      eq: () => ({ select: () => Promise.resolve({ data: null, error: notConfiguredError }) }),
    }),
  };
  return stub as unknown as SupabaseClient;
}

export const supabase = createSafeClient();
