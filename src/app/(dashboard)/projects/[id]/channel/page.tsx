// src/app/(dashboard)/projects/[id]/channel/page.tsx
// Server component — channel batch scrape page.
// Renders ChannelBrowser with the project's ID so users can browse a
// YouTube channel and queue up to 10 videos for scraping.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ChannelBrowser } from '@/components/scraper/ChannelBrowser';

export default async function ChannelScrapePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('re_projects')
    .select('id, name')
    .eq('id', projectId)
    .single();

  if (!project) notFound();

  return (
    <div>
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="text-[--re-text-muted] text-sm hover:text-[--re-text-primary] flex items-center gap-1 mb-4"
      >
        <ChevronLeft className="w-4 h-4" /> Back to {project.name}
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[--re-text-primary]">
          Scrape from Channel
        </h1>
        <p className="text-[--re-text-muted] text-sm mt-1">
          Browse a YouTube channel and select up to 10 videos to scrape.
        </p>
      </div>
      <ChannelBrowser projectId={projectId} />
    </div>
  );
}
