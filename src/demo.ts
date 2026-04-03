import { createAndroidAgent, ensureAdbReady, launchAndroidApp } from './lib/device';
import { loadRuntimeEnv, HONGGUO_DEMO } from './lib/config';
import { assertMidsceneEnv, runHongguoTaskFlow } from './lib/hongguo';

async function main() {
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
