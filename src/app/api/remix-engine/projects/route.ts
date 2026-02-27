// src/app/api/remix-engine/projects/route.ts
// GET — Returns the authenticated user's projects.
// Used by the Header quick-add ProjectSelector component.
//
// Returns:
//   200 { projects: Array<{ id, name }> }
//   401 { error: 'Unauthorized' }

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: projects } = await supabase
    .from('re_projects')
    .select('id, name')
    .order('created_at', { ascending: false });

  return NextResponse.json({ projects: projects ?? [] });
}
