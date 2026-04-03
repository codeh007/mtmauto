import type { AndroidAgent } from '@midscene/android';
import { HONGGUO_DEMO } from './config.js';
import { logStep, readForegroundState, sleep } from './device.js';

type DemoOutcome = 'demo_ok' | 'blocked_by_login' | 'unknown_reward_state';

function containsAny(texts: string[], keywords: readonly string[]) {
  return keywords.some((keyword) => texts.some((text) => text.includes(keyword)));
}

function pickVisibleAction(texts: string[], candidates: readonly string[]) {
  for (const candidate of candidates) {
    const matched = texts.find((text) => text.includes(candidate));
    if (matched) {
      return matched;
    }
  }

  return null;
}

export function assertMidsceneEnv() {
  const requiredKeys = ['MIDSCENE_MODEL_API_KEY', 'MIDSCENE_MODEL_NAME', 'MIDSCENE_MODEL_BASE_URL'];
  const missingKeys = requiredKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `缺少 Midscene 模型环境变量: ${missingKeys.join(', ')}。请确认已在当前工作目录的 .env / .env.local（或兼容旧结构的 env/dev.env）中完成配置，或通过 --env-file 指定配置文件。`,
    );
  }
}

export async function queryVisibleTexts(agent: AndroidAgent, description: string) {
  logStep(`读取当前可见文案：${description}`);
  const result = await agent.aiQuery<string[]>(
    `string[], return the visible major labels, buttons and task related texts on the current ${HONGGUO_DEMO.appName} screen in Chinese`,
  );
  const texts = Array.isArray(result)
    ? result.filter((item) => typeof item === 'string' && item.trim().length > 0)
    : [];

  console.log(`[mtmauto] ${description}:`, texts);
  return texts;
}

export async function ensureHongguoHome(agent: AndroidAgent) {
  await agent.aiWaitFor(
    'The Hongguo home screen is visible and shows the bottom navigation tabs 首页, 剧场, 商城, 赚钱 and 我的.',
  );
  const texts = await queryVisibleTexts(agent, '红果首页');

  if (!containsAny(texts, HONGGUO_DEMO.homeKeywords)) {
    throw new Error('当前界面不像红果首页，未识别到首页底部导航关键词');
  }

  return texts;
}

export async function openRewardPage(agent: AndroidAgent) {
  logStep(`点击底部入口：${HONGGUO_DEMO.rewardTabLabel}`);
  await agent.aiTap(HONGGUO_DEMO.rewardTabLabel);
  await sleep(3_000);

  const texts = await queryVisibleTexts(agent, '赚钱页');
  if (!containsAny(texts, HONGGUO_DEMO.rewardPageKeywords)) {
    throw new Error('点击赚钱后没有进入预期的赚钱页');
  }

  return texts;
}

export async function performPrimaryAction(agent: AndroidAgent, texts: string[]) {
  const action = pickVisibleAction(texts, HONGGUO_DEMO.primaryActionKeywords);
  if (!action) {
    throw new Error(`赚钱页未找到可执行动作：${HONGGUO_DEMO.primaryActionKeywords.join(' / ')}`);
  }

  logStep(`执行红果最小任务动作：${action}`);
  await agent.aiTap(action);
  await sleep(4_000);

  return queryVisibleTexts(agent, '执行任务动作后的页面');
}

function classifyDemoOutcome(texts: string[], foregroundState: { topPackage: string; topActivity: string }): DemoOutcome {
  if (
    foregroundState.topPackage === HONGGUO_DEMO.packageName &&
    (foregroundState.topActivity === HONGGUO_DEMO.loginActivity ||
      foregroundState.topActivity.toLowerCase().includes('login') ||
      containsAny(texts, HONGGUO_DEMO.loginKeywords))
  ) {
    return 'blocked_by_login';
  }

  if (
    foregroundState.topPackage === HONGGUO_DEMO.packageName &&
    (foregroundState.topActivity === HONGGUO_DEMO.mainActivity || containsAny(texts, HONGGUO_DEMO.successKeywords))
  ) {
    return 'demo_ok';
  }

  return 'unknown_reward_state';
}

export async function runHongguoTaskFlow(agent: AndroidAgent) {
  await ensureHongguoHome(agent);
  const rewardTexts = await openRewardPage(agent);
  const resultTexts = await performPrimaryAction(agent, rewardTexts);
  const foregroundState = await readForegroundState();
  const outcome = classifyDemoOutcome(resultTexts, foregroundState);

  console.log('[mtmauto] 前台状态:', foregroundState);
  console.log('[mtmauto] 演示结果:', outcome);

  if (outcome === 'unknown_reward_state') {
    throw new Error('红果任务流执行后未能确认当前是否仍处于有效业务链路');
  }

  if (outcome === 'blocked_by_login') {
    logStep('奖励动作已被真实触发，但当前设备被登录边界拦截。');
    return;
  }
}
