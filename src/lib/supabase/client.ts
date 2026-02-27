// src/lib/supabase/client.ts
// Browser Supabase client — reads from RemixEngine config, NOT process.env.
// Use this in Client Components and browser-side code.

import { createBrowserClient } from '@supabase/ssr';
import { getServerConfig } from '../remix-engine/config';

export function createClient() {
  const config = getServerConfig();
  return createBrowserClient(
    config.supabase.url,
    config.supabase.anonKey
  );
}
