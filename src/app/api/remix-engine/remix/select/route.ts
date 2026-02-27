import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Use broad UUID regex — Zod v4 enforces strict version bits (rejects all-letter test UUIDs)
const uuidSchema = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid UUID format');

const BodySchema = z.object({
  videoId: uuidSchema,
  type: z.enum(['title', 'thumbnail', 'script']),
  id: uuidSchema, // ID of the item to select
  editedText: z.string().optional(), // For inline title edit — saves text AND marks selected
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { videoId, type, id, editedText } = body.data;

  const tableMap = {
    title: 're_remixed_titles',
    thumbnail: 're_remixed_thumbnails',
    script: 're_remixed_scripts',
  } as const;
  const table = tableMap[type];

  // Clear all selections for this video+type
  await supabase.from(table).update({ is_selected: false }).eq('video_id', videoId);

  // Set the chosen item as selected, optionally updating text
  const updatePayload: Record<string, unknown> = { is_selected: true };
  if (editedText && type === 'title') updatePayload.title = editedText;

  const { error } = await supabase.from(table).update(updatePayload).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

// Also support inline scene text edit via PATCH
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = z.object({
    sceneId: uuidSchema,
    dialogueLine: z.string().min(1),
  }).safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { error } = await supabase
    .from('re_scenes')
    .update({ dialogue_line: body.data.dialogueLine })
    .eq('id', body.data.sceneId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
