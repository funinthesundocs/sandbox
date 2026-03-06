import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectsClient } from './ProjectsClient';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('re_projects')
    .select('id, name, description, status, created_at, updated_at, re_videos(count)')
    .order('created_at', { ascending: false });

  // Normalize the Supabase embed shape: re_videos: [{count: N}] → videoCount: N
  const normalized = (projects ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    description: (p.description ?? null) as string | null,
    status: p.status as string,
    created_at: p.created_at as string,
    updated_at: p.updated_at as string,
    videoCount: Array.isArray(p.re_videos) && p.re_videos.length > 0
      ? (p.re_videos[0] as { count: number }).count
      : 0,
  }));

  return <ProjectsClient projects={normalized} />;
}
