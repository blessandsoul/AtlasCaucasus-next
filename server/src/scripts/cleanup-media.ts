#!/usr/bin/env node

/**
 * CLI script to manually run the media cleanup job
 *
 * Usage:
 *   npm run cleanup:media
 *   or
 *   node --loader ts-node/esm src/scripts/cleanup-media.ts
 */

import { runMediaCleanupJobCLI } from "../jobs/media-cleanup.job.js";

async function main() {
  try {
    await runMediaCleanupJobCLI();
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
