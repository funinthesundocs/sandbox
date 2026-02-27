// src/lib/supabase/admin.ts
// For worker use only — bypasses RLS using the service role key.
// NEVER use this client in API routes or browser code.
// Only import from src/worker/ handlers.

import { createClient } from '@supabase/supabase-js';
import { getServerConfig } from '../remix-engine/config';

const config = getServerConfig();

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
    },
  }
);
