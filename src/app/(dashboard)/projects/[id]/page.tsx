import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

  const { data: project } = await supabase
    .from('re_projects')
    .select('id')
    .eq('id', id)
    .single();

  if (!project) notFound();

  return <div />;
}
