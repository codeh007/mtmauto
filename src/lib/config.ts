import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { config as loadDotenv } from 'dotenv';

export interface VmosConfig {
  sshUser: string;
  sshHost: string;
  sshPort: string;
  sshPassword: string;
  localAdbPort: string;
  remoteAdbHost: string;
  remoteAdbPort: string;
}

const requiredVmosEnvKeys = [
  'VMOS_SSH_USER',
  'VMOS_SSH_HOST',
  'VMOS_SSH_PORT',
  'VMOS_SSH_PASSWORD',
  'VMOS_LOCAL_ADB_PORT',
  'VMOS_REMOTE_ADB_HOST',
  'VMOS_REMOTE_ADB_PORT',
] as const;

function readRequiredEnv(env: NodeJS.ProcessEnv, key: (typeof requiredVmosEnvKeys)[number]) {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`缺少云手机连接环境变量: ${key}`);
  }

  return value;
}

export function resolveVmosConfig(env: NodeJS.ProcessEnv): VmosConfig {
  return {
    sshUser: readRequiredEnv(env, 'VMOS_SSH_USER'),
    sshHost: readRequiredEnv(env, 'VMOS_SSH_HOST'),
    sshPort: readRequiredEnv(env, 'VMOS_SSH_PORT'),
    sshPassword: readRequiredEnv(env, 'VMOS_SSH_PASSWORD'),
    localAdbPort: readRequiredEnv(env, 'VMOS_LOCAL_ADB_PORT'),
    remoteAdbHost: readRequiredEnv(env, 'VMOS_REMOTE_ADB_HOST'),
    remoteAdbPort: readRequiredEnv(env, 'VMOS_REMOTE_ADB_PORT'),
  };
}

export function getVmosConfig() {
  return resolveVmosConfig(process.env);
}

export function getDemoSerial(config: VmosConfig = getVmosConfig()) {
  return `localhost:${config.localAdbPort}`;
}

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

export interface RuntimeEnvLoadOptions {
  cwd?: string;
  envFile?: string;
}

function resolveCallerCwd(cwd: string) {
  return path.resolve(cwd);
}

function resolveEnvFilePath(envFile: string, cwd: string) {
  return path.isAbsolute(envFile) ? envFile : path.resolve(cwd, envFile);
}

function applyDefaultEnvFiles(cwd: string) {
  const defaultEnvFile = path.join(cwd, '.env');
  const localEnvFile = path.join(cwd, '.env.local');
  const legacyEnvFile = path.join(cwd, 'env/dev.env');

  if (existsSync(defaultEnvFile)) {
    loadDotenv({ path: defaultEnvFile });
  } else if (existsSync(legacyEnvFile)) {
    loadDotenv({ path: legacyEnvFile });
  }

  if (existsSync(localEnvFile)) {
    loadDotenv({ path: localEnvFile, override: true });
  }
}

export function loadRuntimeEnv(options: RuntimeEnvLoadOptions = {}) {
  const cwd = resolveCallerCwd(options.cwd ?? process.cwd());

  if (options.envFile) {
    const envFilePath = resolveEnvFilePath(options.envFile, cwd);
    if (!existsSync(envFilePath)) {
      throw new Error(`指定的环境变量文件不存在: ${envFilePath}`);
    }

    loadDotenv({ path: envFilePath });
  } else {
    applyDefaultEnvFiles(cwd);
  }

  process.env.MIDSCENE_MODEL_FAMILY ||= 'gpt-5';
}
