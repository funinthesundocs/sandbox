import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectDetailClient } from './ProjectDetailClient';

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
          <p className="text-[--re-text-muted] text-sm mt-1">
            {project.description}
          </p>
        )}
      </div>

      <ProjectDetailClient
        projectId={id}
        projectName={project.name}
        initialVideos={videos ?? []}
      />
    </div>
  );
}
