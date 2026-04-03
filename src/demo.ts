#!/usr/bin/env node

import { createAndroidAgent, ensureAdbReady, launchAndroidApp } from './lib/device.js';
import { loadRuntimeEnv, HONGGUO_DEMO } from './lib/config.js';
import { assertMidsceneEnv, runHongguoTaskFlow } from './lib/hongguo.js';

function printHelp() {
  console.log(`
mtm-auto - Midscene Android automation demo CLI

Usage:
  mtm-auto
  npx codeh007-mtmauto

Required env vars:
  MIDSCENE_MODEL_API_KEY
  MIDSCENE_MODEL_NAME
  MIDSCENE_MODEL_BASE_URL
  VMOS_SSH_USER
  VMOS_SSH_HOST
  VMOS_SSH_PORT
  VMOS_SSH_PASSWORD
  VMOS_LOCAL_ADB_PORT
  VMOS_REMOTE_ADB_HOST
  VMOS_REMOTE_ADB_PORT

You can provide them through .env, .env.local, or env/dev.env.
`);
}

export async function main(argv: string[] = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }

  loadRuntimeEnv();
  assertMidsceneEnv();
  await ensureAdbReady();
  await launchAndroidApp(HONGGUO_DEMO.packageName, HONGGUO_DEMO.launchActivity);

  const agent = await createAndroidAgent(HONGGUO_DEMO.aiActionContext);
  await runHongguoTaskFlow(agent);
}

main().catch((error) => {
  console.error('\n[mtm-auto] 运行失败');
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
