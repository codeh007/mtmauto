import { createAndroidAgent, ensureAdbReady, launchAndroidApp } from './lib/device.js';
import { loadRuntimeEnv } from './lib/config.js';
import { assertMidsceneEnv, HONGGUO_DEMO, runHongguoTaskFlow } from './lib_apps/hongguo.js';

export interface HongguoRuntimeOptions {
  cwd?: string;
  envFile?: string;
}

export async function runHongguoDemo(options: HongguoRuntimeOptions = {}) {
  loadRuntimeEnv({
    cwd: options.cwd,
    envFile: options.envFile,
  });
  assertMidsceneEnv();
  await ensureAdbReady();
  await launchAndroidApp(HONGGUO_DEMO.packageName, HONGGUO_DEMO.launchActivity);

  const agent = await createAndroidAgent(HONGGUO_DEMO.aiActionContext);
  await runHongguoTaskFlow(agent);
}
