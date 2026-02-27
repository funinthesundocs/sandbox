// src/lib/remix-engine/config.ts
// RemixEngineConfig type + createStandaloneConfig() + getServerConfig() + setServerConfig()
// IMPORTANT: createStandaloneConfig() is the ONLY place process.env is read in the entire codebase.

export interface RemixEngineConfig {
  mode: 'standalone' | 'module';
  routePrefix: string;           // default: '/remix-engine' (for API routes)
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  redis: { url: string };
  apiKeys: {
    youtube: string;
    gemini: string;
    falAi: string;
    elevenLabs: string;
    heyGen: string;
    runwayMl: string;
    kling?: string;
  };
  auth?: {
    user: { id: string; email: string; full_name?: string };
    role: 'admin' | 'editor' | 'viewer';
  };
  webhookBaseUrl: string;
  storagePrefix: string;   // default: 'remix-engine'
  tablePrefix: string;     // default: 're_'
}

/**
 * createStandaloneConfig() — THE ONLY PLACE process.env IS READ.
 * All other files must use getServerConfig() or useRemixEngine().
 */
export function createStandaloneConfig(): RemixEngineConfig {
  return {
    mode: 'standalone',
    routePrefix: '/remix-engine',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    apiKeys: {
      youtube: process.env.YOUTUBE_DATA_API_KEY ?? '',
      gemini: process.env.GOOGLE_GEMINI_API_KEY ?? '',
      falAi: process.env.FAL_KEY ?? '',
      elevenLabs: process.env.ELEVENLABS_API_KEY ?? '',
      heyGen: process.env.HEYGEN_API_KEY ?? '',
      runwayMl: process.env.RUNWAY_API_KEY ?? '',
      kling: process.env.KLING_API_KEY,
    },
    webhookBaseUrl:
      process.env.WEBHOOK_BASE_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000',
    storagePrefix: 'remix-engine',
    tablePrefix: 're_',
  };
}

// Server-side singleton — set once at app startup via setServerConfig()
let _serverConfig: RemixEngineConfig | null = null;

/**
 * getServerConfig() — Returns the server-side singleton config.
 * Throws if setServerConfig() has not been called yet (or in standalone mode,
 * falls back to createStandaloneConfig() automatically).
 */
export function getServerConfig(): RemixEngineConfig {
  if (!_serverConfig) {
    // Auto-bootstrap in standalone mode so server utilities work without
    // explicit provider setup (e.g. in API routes, worker, migrations).
    _serverConfig = createStandaloneConfig();
  }
  return _serverConfig;
}

/**
 * setServerConfig() — Override the server singleton.
 * Called by RemixEngineProvider in module mode to inject external config.
 */
export function setServerConfig(config: RemixEngineConfig): void {
  _serverConfig = config;
}
