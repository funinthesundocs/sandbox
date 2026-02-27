// src/app/(auth)/layout.tsx
// Auth route group layout — only renders in standalone mode (per RM.8).
// In module mode, auth pages do not exist — return null.

import { getServerConfig } from '@/lib/remix-engine/config';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getServerConfig();

  // Auth pages only exist in standalone mode (RM.8).
  // In module mode, the host app handles its own auth.
  if (config.mode === 'module') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--re-bg-primary]">
      <div className="w-full max-w-md px-6 py-8">
        {children}
      </div>
    </div>
  );
}
