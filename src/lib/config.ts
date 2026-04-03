import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectDir = path.resolve(__dirname, '../..');
export const repoRoot = path.resolve(projectDir, '../..');

export const VMOS = {
  sshUser: '10.1.147.39_1775128466919',
  sshHost: '107.151.131.2',
  sshPort: '1824',
  sshPassword: 'YRfSin7EC5bEMlfbUQxNTs3+mz1Rek55drRtX1V0osq1polwW+iQAh8ZnnTfjTrTrgrJxwFVPizN2/Wi8PDzgg==',
  localAdbPort: '7184',
  remoteAdbHost: 'adb-proxy',
  remoteAdbPort: '39427',
} as const;

export const DEMO_SERIAL = `localhost:${VMOS.localAdbPort}`;

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

export function loadRuntimeEnv() {
  loadDotenv({ path: path.join(repoRoot, 'env/dev.env') });
  process.env.MIDSCENE_MODEL_FAMILY ||= 'gpt-5';
}
