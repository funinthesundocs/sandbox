import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('re_projects')
    .select('id, name, description, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="font-semibold text-[--re-text-primary]"
          style={{ fontSize: 'var(--re-text-xl)' }}
        >
          Projects
        </h1>
        {/* Create project button — wires in Phase 3/6 */}
        <Link href="/dashboard/projects/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {(projects?.length ?? 0) === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="w-12 h-12 text-[--re-text-disabled] mx-auto mb-4" />
          <p className="text-[--re-text-primary] font-medium">No projects yet</p>
          <p className="text-[--re-text-muted] text-sm mt-1">
            Create your first project to start remixing videos
          </p>
        </div>
      )}

      {/* Project cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.map((project) => (
          <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
            <div className="p-4 rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60 hover:border-[--re-accent-primary]/40 transition-all duration-200 cursor-pointer">
              <h3 className="text-[--re-text-primary] font-medium">{project.name}</h3>
              {project.description && (
                <p className="text-[--re-text-muted] text-sm mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="text-[--re-text-muted] text-xs mt-3">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
