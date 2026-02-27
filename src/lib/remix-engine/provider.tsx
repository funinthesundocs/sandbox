'use client';

// src/lib/remix-engine/provider.tsx
// RemixEngineProvider — wraps the application with RemixEngine config context.
// In standalone mode, reads config from createStandaloneConfig() (env vars).
// In module mode, accepts config prop from the embedding host application.
// DO NOT read process.env here — only createStandaloneConfig() in config.ts does that.

import React from 'react';
import { RemixEngineConfig, createStandaloneConfig, setServerConfig } from './config';
import { RemixEngineContext } from './hooks';

interface RemixEngineProviderProps {
  children: React.ReactNode;
  /** Provide config explicitly (module mode). If omitted, uses createStandaloneConfig(). */
  config?: RemixEngineConfig;
}

export function RemixEngineProvider({ children, config }: RemixEngineProviderProps) {
  const resolvedConfig = config ?? createStandaloneConfig();

  // Keep server singleton in sync when running in SSR contexts.
  // This is a no-op in purely client-side renders but ensures API routes
  // that call getServerConfig() see the same config as the provider.
  setServerConfig(resolvedConfig);

  return (
    <RemixEngineContext.Provider value={resolvedConfig}>
      {children}
    </RemixEngineContext.Provider>
  );
}
