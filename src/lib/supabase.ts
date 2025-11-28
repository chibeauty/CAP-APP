import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wxgxbmvuzryuazsoobdb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Debug: Check if key is loaded
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Config Check:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey.length,
    keyFirstChars: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING',
    allEnvKeys: Object.keys(import.meta.env).filter(k => k.includes('SUPABASE'))
  });
}

if (!supabaseAnonKey) {
  console.error('❌ CRITICAL: Supabase anon key is missing!');
  console.error('Please add VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server.');
  console.error('Current .env variables:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Found but empty' : 'Not found');
}

// Create a singleton client instance to prevent multiple GoTrueClient instances
// Using a global variable to persist across hot module reloads
declare global {
  var __supabaseClient: SupabaseClient | undefined;
}

function getSupabaseClient(): SupabaseClient {
  // Clear cached client if key changed (for hot reload)
  const currentKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
  if (import.meta.env.DEV && globalThis.__supabaseClient) {
    // Check if key has changed - if so, clear cache
    const cachedKey = (globalThis.__supabaseClient as any).__cachedKey;
    if (cachedKey !== currentKey) {
      console.log('🔄 Supabase key changed, recreating client...');
      globalThis.__supabaseClient = undefined;
    } else {
      return globalThis.__supabaseClient;
    }
  }

  // Validate that we have a key before creating the client
  if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
    const errorMsg = 'Supabase anon key is missing or invalid. Please set VITE_SUPABASE_ANON_KEY in your .env file and restart the dev server.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'cap-app-auth-token',
    },
  });

  // Store the key for comparison on next load
  (client as any).__cachedKey = currentKey;

  if (import.meta.env.DEV) {
    globalThis.__supabaseClient = client;
  }

  return client;
}

export const supabase: SupabaseClient = getSupabaseClient();

