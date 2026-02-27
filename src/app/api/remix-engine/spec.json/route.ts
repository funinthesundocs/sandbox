// src/app/api/remix-engine/spec.json/route.ts
// GET /api/remix-engine/spec.json
// Returns the RemixEngine module contract — capabilities, route map, table names, etc.
// Used by host applications in module mode to discover what RemixEngine exposes.

import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/remix-engine/config';

export async function GET() {
  const config = getServerConfig();

  const spec = {
    name: 'RemixEngine',
    version: '1.0.0',
    mode: config.mode,
    routePrefix: config.routePrefix,
    tables: [
      're_users',
      're_projects',
      're_videos',
      're_jobs',
      're_scenes',
      're_api_usage',
    ],
    storagePrefix: config.storagePrefix,
    queues: ['scrape', 'remix', 'generate', 'render'],
    routes: {
      health: '/api/remix-engine/health',
      spec: '/api/remix-engine/spec.json',
      scrape: '/api/remix-engine/scrape',
      remix: '/api/remix-engine/remix',
      generate: '/api/remix-engine/generate',
      render: '/api/remix-engine/render',
    },
  };

  return NextResponse.json(spec);
}
