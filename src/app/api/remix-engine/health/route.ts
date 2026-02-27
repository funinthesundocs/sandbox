// src/app/api/remix-engine/health/route.ts
// GET /api/remix-engine/health
// Health check endpoint — returns service status, mode, and timestamp.

import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/remix-engine/config';

export async function GET() {
  const config = getServerConfig();

  return NextResponse.json({
    status: 'ok',
    mode: config.mode,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}
