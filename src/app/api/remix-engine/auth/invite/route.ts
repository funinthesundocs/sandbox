// src/app/api/remix-engine/auth/invite/route.ts
// POST /api/remix-engine/auth/invite
// Admin-only endpoint to invite users via Supabase inviteUserByEmail.
// Requires: authenticated user with role === 'admin' in user_metadata.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { InviteUserSchema } from '@/lib/validators/schemas';

export async function POST(request: Request) {
  // Step 1: Verify the requesting user is authenticated.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 2: Verify the user has admin role.
  const role = user.user_metadata?.role;
  if (role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden — admin role required' },
      { status: 403 }
    );
  }

  // Step 3: Parse and validate the request body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = InviteUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role: invitedRole, fullName } = parsed.data;

  // Step 4: Send the invite via Supabase admin auth.
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: invitedRole,
      full_name: fullName ?? '',
    },
  });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to send invite', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    email: data.user.email,
  });
}
