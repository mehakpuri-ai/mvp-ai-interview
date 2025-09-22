// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy-init Supabase client.
 * This prevents createClient(...) from running at module import time
 * (which caused build-time crashes when env vars were missing).
 *
 * Usage:
 * 1) Preferred: import { getSupabaseClient } and call it when needed.
 * 2) Backwards-compatible: keep importing { supabaseClient } — it's a proxy
 *    that forwards calls to the real client and will initialize lazily.
 */

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }

  _client = createClient(url, anonKey);
  return _client;
}

/**
 * Backwards-compatible proxy object so existing imports like:
 *   import { supabaseClient } from '@/lib/supabaseClient';
 * continue to work without changing calls.
 *
 * Accessing any property on `supabaseClient` will initialize the real client first.
 */
export const supabaseClient = new Proxy(
  {},
  {
    get(_, prop: string) {
      const client = getSupabaseClient();
      // @ts-ignore - forward property access to the real client
      return (client as any)[prop];
    },
    // allow setting properties if needed
    set(_, prop: string, value) {
      const client = getSupabaseClient();
      // @ts-ignore
      (client as any)[prop] = value;
      return true;
    },
    has(_, prop: string) {
      const client = getSupabaseClient();
      // @ts-ignore
      return prop in client;
    },
    ownKeys() {
      const client = getSupabaseClient();
      return Reflect.ownKeys(client as any);
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true,
      };
    },
  }
) as unknown as SupabaseClient;
