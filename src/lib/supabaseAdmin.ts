// src/lib/supabaseAdmin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy-init Supabase admin client (server-side, service role).
 *
 * Usage:
 *   const admin = getSupabaseAdmin();
 *   await admin.from('table').select();
 *
 * For backwards compatibility, you can still:
 *   import { supabaseAdmin } from '@/lib/supabaseAdmin';
 * and call supabaseAdmin.from(...), etc.
 */

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }

  _admin = createClient(url, serviceRoleKey);
  return _admin;
}

/**
 * Backwards-compatible proxy so existing imports like:
 *   import { supabaseAdmin } from '@/lib/supabaseAdmin';
 * keep working. Property accesses initialize the client lazily.
 */
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_, prop: string) {
      const client = getSupabaseAdmin();
      // @ts-ignore forward property access
      return (client as any)[prop];
    },
    set(_, prop: string, value) {
      const client = getSupabaseAdmin();
      // @ts-ignore
      (client as any)[prop] = value;
      return true;
    },
    has(_, prop: string) {
      const client = getSupabaseAdmin();
      return prop in (client as any);
    },
    ownKeys() {
      const client = getSupabaseAdmin();
      return Reflect.ownKeys(client as any);
    },
    getOwnPropertyDescriptor() {
      return { enumerable: true, configurable: true };
    },
  }
) as unknown as SupabaseClient;
