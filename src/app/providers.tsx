'use client';

// src/app/providers.tsx
// Client component that composes RemixEngineProvider and ThemeProvider.
// Used by root layout (server component) to wrap the app in client providers.

import { RemixEngineProvider } from '@/lib/remix-engine/provider';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <RemixEngineProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </RemixEngineProvider>
  );
}
