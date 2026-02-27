/**
 * Worker entry point — runs as separate Node.js process outside Next.js.
 * Uses tsconfig.worker.json. No @/ aliases. Import from relative paths only.
 *
 * Start with: npx ts-node -p tsconfig.worker.json src/worker/index.ts
 * Or build: npx tsc -p tsconfig.worker.json && node dist/worker/worker/index.js
 */

// Relative imports only — no @/ aliases in worker code
// import { scrapeHandler } from './handlers/scrape';
// import { remixHandler } from './handlers/remix';
// import { generateHandler } from './handlers/generate';
// import { renderHandler } from './handlers/render';

async function main() {
  console.log('RemixEngine worker starting...');

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`RemixEngine worker received ${signal}, shutting down gracefully...`);
    // TODO: Close BullMQ workers before exiting
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('RemixEngine worker running. Waiting for jobs...');
}

main().catch((err) => {
  console.error('Worker startup failed:', err);
  process.exit(1);
});

export { main };
