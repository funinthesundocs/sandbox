// src/app/(dashboard)/layout.tsx
// Dashboard shell — checks config.mode and renders Sidebar+Header (standalone)
// or bare children (module mode).

import { getServerConfig } from '@/lib/remix-engine/config';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getServerConfig();

  // Module mode: no shell UI — the host app provides its own chrome.
  if (config.mode === 'module') {
    return <>{children}</>;
  }

  // Standalone mode: full shell with Sidebar and Header.
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--re-bg-primary)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-auto"
          style={{ padding: 'var(--re-panel-padding)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
