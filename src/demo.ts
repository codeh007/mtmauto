import { createAndroidAgent, ensureAdbReady, launchAndroidApp } from './lib/device.js';
import { loadRuntimeEnv, HONGGUO_DEMO } from './lib/config.js';
import { assertMidsceneEnv, runHongguoTaskFlow } from './lib/hongguo.js';

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
