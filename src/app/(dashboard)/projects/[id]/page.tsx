import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScrapeInput } from '@/components/scraper/ScrapeInput';
import { VideoGrid } from '@/components/scraper/VideoGrid';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch project
  const { data: project } = await supabase
    .from('re_projects')
    .select('id, name, description')
    .eq('id', id)
    .single();

  if (!project) notFound();

  // Fetch videos for this project
  const { data: videos } = await supabase
    .from('re_videos')
    .select(
      'id, youtube_id, original_title, original_thumbnail_url, channel_name, duration_seconds, scrape_status, view_count'
    )
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1
          className="font-semibold text-[--re-text-primary]"
          style={{ fontSize: 'var(--re-text-xl)' }}
        >
          {project.name}
        </h1>
        {project.description && (
          <p className="text-[--re-text-muted] text-sm mt-1">{project.description}</p>
        )}
      </div>

      {/* Scrape entry points */}
      <div className="mb-8 flex items-center gap-3 flex-wrap">
        <ScrapeInput projectId={id} />
        <Link
          href={`/dashboard/projects/${id}/channel`}
          className="inline-flex items-center h-9 px-3 rounded-[--re-border-radius] bg-[--re-bg-secondary] border border-[--re-border] text-[--re-text-secondary] text-sm font-medium hover:bg-[--re-bg-hover] hover:text-[--re-text-primary] transition-colors flex-shrink-0"
        >
          Scrape from Channel
        </Link>
      </div>

      {/* Video library */}
      <VideoGrid videos={videos ?? []} projectId={id} />
    </div>
  );
}
