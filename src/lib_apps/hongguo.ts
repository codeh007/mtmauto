import type { AndroidAgent } from '@midscene/android';
import type { ForegroundState } from '../lib/device.js';
import { logStep, readForegroundState, sleep } from '../lib/device.js';

type DemoOutcome = 'demo_ok' | 'blocked_by_login' | 'unknown_reward_state';

const requiredMidsceneEnvKeys = ['MIDSCENE_MODEL_API_KEY', 'MIDSCENE_MODEL_NAME', 'MIDSCENE_MODEL_BASE_URL'] as const;

const homeScreenWaitPrompt =
  'The Hongguo home screen is visible and shows the bottom navigation tabs 首页, 剧场, 商城, 赚钱 and 我的.';

const rewardPageWaitPrompt =
  'The Hongguo reward page is visible and shows earning-related labels such as 金币收益, 现金收益, 赚钱, 立即领取, 立即签到 or 去看剧.';

export const HONGGUO_DEMO = {
  appName: '红果免费短剧',
  packageName: 'com.phoenix.read',
  launchActivity: 'com.dragon.read.pages.splash.SplashActivity',
  mainActivity: 'com.dragon.read.pages.main.MainFragmentActivity',
  loginActivity: 'com.dragon.read.component.biz.impl.mine.LoginActivity',
  rewardTabLabel: '赚钱',
  homeKeywords: ['首页', '剧场', '商城', '赚钱', '我的'],
  rewardPageKeywords: ['金币收益', '现金收益', '赚钱', '立即领取', '立即签到', '去看剧'],
  primaryActionKeywords: ['立即签到', '立即领取', '去看剧'],
  successKeywords: ['金币收益', '现金收益', '预约成功', '明日领取', '我知道了', '赚钱'],
  loginKeywords: ['登录', '手机号', '验证码', '去登录', '立即登录'],
  aiActionContext: [
    '你正在操作红果免费短剧 App。',
    '当前任务只需要完成最小真实自动化操作，不要做多余演示动作。',
    '优先进入赚钱页，然后只执行一次最合适的任务动作：立即签到、立即领取，或者去看剧。',
    '如果出现权限弹窗、登录弹窗、广告弹窗或升级提示，优先关闭、跳过或返回，不要尝试登录。',
  ].join(' '),
} as const;

function containsAny(texts: readonly string[], keywords: readonly string[]) {
  return keywords.some((keyword) => texts.some((text) => text.includes(keyword)));
}

function assertContainsAny(texts: readonly string[], keywords: readonly string[], errorMessage: string) {
  if (!containsAny(texts, keywords)) {
    throw new Error(errorMessage);
  }
}

function pickVisibleAction(texts: readonly string[], candidates: readonly string[]) {
  for (const candidate of candidates) {
    const matched = texts.find((text) => text.includes(candidate));
    if (matched) {
      return matched;
    }
  }

  return null;
}

function normalizeVisibleTexts(result: unknown) {
  if (!Array.isArray(result)) {
    return [];
  }

  return result.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function pickPrimaryAction(texts: readonly string[]) {
  const action = pickVisibleAction(texts, HONGGUO_DEMO.primaryActionKeywords);
  if (!action) {
    throw new Error(`赚钱页未找到可执行动作：${HONGGUO_DEMO.primaryActionKeywords.join(' / ')}`);
  }

  return action;
}

function classifyDemoOutcome(texts: readonly string[], foregroundState: ForegroundState): DemoOutcome {
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

export function assertMidsceneEnv() {
  const missingKeys = requiredMidsceneEnvKeys.filter((key) => !process.env[key]);
  if (missingKeys.length > 0) {
    throw new Error(
      `缺少 Midscene 模型环境变量: ${missingKeys.join(', ')}。请确认已在当前工作目录的 .env / .env.local（或兼容旧结构的 env/dev.env）中完成配置，或通过 --env-file 指定配置文件。`,
    );
  }
}

export async function queryVisibleTexts(agent: AndroidAgent, description: string) {
  logStep(`读取当前可见文案：${description}`);
  const result = await agent.aiQuery<string[]>(
    `string[], return the visible major labels, buttons, dialogs and reward-related texts on the current ${HONGGUO_DEMO.appName} screen in Chinese`,
  );
  const texts = normalizeVisibleTexts(result);

  console.log(`[mtmauto] ${description}:`, texts);
  return texts;
}

async function waitForHongguoHome(agent: AndroidAgent) {
  logStep('等待红果首页稳定');
  await agent.aiWaitFor(homeScreenWaitPrompt);
}

async function readHongguoHome(agent: AndroidAgent) {
  const texts = await queryVisibleTexts(agent, '红果首页');
  assertContainsAny(texts, HONGGUO_DEMO.homeKeywords, '当前界面不像红果首页，未识别到首页底部导航关键词');
  return texts;
}

export async function ensureHongguoHome(agent: AndroidAgent) {
  await waitForHongguoHome(agent);
  return readHongguoHome(agent);
}

async function tapRewardTab(agent: AndroidAgent) {
  logStep(`点击底部入口：${HONGGUO_DEMO.rewardTabLabel}`);
  await agent.aiTap(HONGGUO_DEMO.rewardTabLabel);
}

async function waitForRewardPage(agent: AndroidAgent) {
  logStep('等待赚钱页稳定');
  await agent.aiWaitFor(rewardPageWaitPrompt);
}

async function readRewardPage(agent: AndroidAgent) {
  const texts = await queryVisibleTexts(agent, '赚钱页');
  assertContainsAny(texts, HONGGUO_DEMO.rewardPageKeywords, '点击赚钱后没有进入预期的赚钱页');
  return texts;
}

export async function openRewardPage(agent: AndroidAgent) {
  await tapRewardTab(agent);
  await waitForRewardPage(agent);
  return readRewardPage(agent);
}

async function tapPrimaryAction(agent: AndroidAgent, texts: readonly string[]) {
  const action = pickPrimaryAction(texts);
  logStep(`执行红果最小任务动作：${action}`);
  await agent.aiTap(action);

  return action;
}

async function settleAfterPrimaryAction(action: string) {
  logStep(`等待任务动作完成：${action}`);
  await sleep(4_000);
}

async function readPrimaryActionResult(agent: AndroidAgent) {
  return queryVisibleTexts(agent, '执行任务动作后的页面');
}

export async function performPrimaryAction(agent: AndroidAgent, texts: readonly string[]) {
  const action = await tapPrimaryAction(agent, texts);
  await settleAfterPrimaryAction(action);
  return readPrimaryActionResult(agent);
}

async function inspectTaskOutcome(texts: readonly string[]) {
  const foregroundState = await readForegroundState();
  const outcome = classifyDemoOutcome(texts, foregroundState);

  console.log('[mtmauto] 前台状态:', foregroundState);
  console.log('[mtmauto] 演示结果:', outcome);

  return {
    foregroundState,
    outcome,
  };
}

export async function runHongguoTaskFlow(agent: AndroidAgent) {
  await ensureHongguoHome(agent);
  const rewardTexts = await openRewardPage(agent);
  const resultTexts = await performPrimaryAction(agent, rewardTexts);
  const { outcome } = await inspectTaskOutcome(resultTexts);

  if (outcome === 'unknown_reward_state') {
    throw new Error('红果任务流执行后未能确认当前是否仍处于有效业务链路');
  }

  if (outcome === 'blocked_by_login') {
    logStep('奖励动作已被真实触发，但当前设备被登录边界拦截。');
  }
}
