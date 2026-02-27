// src/lib/supabase/server.ts
// Server Supabase client — reads from RemixEngine config, NOT process.env.
// Use this in Server Components, API routes, and server actions.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerConfig } from '../remix-engine/config';

export async function createClient() {
  const cookieStore = await cookies();
  const config = getServerConfig();

  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware refreshes sessions.
          }
        },
      },
    }
  );
}
