import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify all selections exist
  const [titlesResult, thumbsResult, scriptsResult] = await Promise.all([
    supabase
      .from('re_remixed_titles')
      .select('id')
      .eq('video_id', videoId)
      .eq('is_selected', true),
    supabase
      .from('re_remixed_thumbnails')
      .select('id')
      .eq('video_id', videoId)
      .eq('is_selected', true),
    supabase.from('re_remixed_scripts').select('id').eq('video_id', videoId),
  ]);

  const hasTitle = (titlesResult.data?.length ?? 0) > 0;
  const hasThumbnail = (thumbsResult.data?.length ?? 0) > 0;
  const hasScript = (scriptsResult.data?.length ?? 0) > 0;

  if (!hasTitle || !hasThumbnail || !hasScript) {
    return NextResponse.json(
      {
        error:
          'Title, thumbnail, and script must all be selected before approving',
      },
      { status: 422 }
    );
  }

  // The unlock signal is the presence of selections (is_selected=true).
  // The Generation tab checks remix_status='complete' AND selected items on its page.
  // No additional DB write needed — selections are the authoritative unlock signal.
  return NextResponse.json({ success: true, videoId });
}
