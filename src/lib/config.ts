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
