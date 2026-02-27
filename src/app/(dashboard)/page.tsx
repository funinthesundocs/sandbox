// src/app/(dashboard)/page.tsx
// Redirect root dashboard path to /dashboard/projects.

import { redirect } from 'next/navigation';

export default function DashboardIndexPage() {
  redirect('/dashboard/projects');
}
