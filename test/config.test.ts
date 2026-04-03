import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRuntimeEnv, resolveVmosConfig } from '../src/lib/config';

test('resolveVmosConfig reads all required env keys', () => {
  const config = resolveVmosConfig({
    VMOS_SSH_USER: 'user',
    VMOS_SSH_HOST: 'host.example.com',
    VMOS_SSH_PORT: '22',
    VMOS_SSH_PASSWORD: 'secret',
    VMOS_LOCAL_ADB_PORT: '5555',
    VMOS_REMOTE_ADB_HOST: 'adb-proxy',
    VMOS_REMOTE_ADB_PORT: '5037',
  });

  assert.deepEqual(config, {
    sshUser: 'user',
    sshHost: 'host.example.com',
    sshPort: '22',
    sshPassword: 'secret',
    localAdbPort: '5555',
    remoteAdbHost: 'adb-proxy',
    remoteAdbPort: '5037',
  });
});

test('resolveVmosConfig throws when a required env key is missing', () => {
  assert.throws(
    () =>
      resolveVmosConfig({
        VMOS_SSH_USER: 'user',
        VMOS_SSH_HOST: 'host.example.com',
        VMOS_SSH_PORT: '22',
        VMOS_SSH_PASSWORD: 'secret',
        VMOS_LOCAL_ADB_PORT: '5555',
        VMOS_REMOTE_ADB_HOST: 'adb-proxy',
      }),
    /VMOS_REMOTE_ADB_PORT/,
  );
});

function cleanupEnv(keys: string[]) {
  for (const key of keys) {
    delete process.env[key];
  }
}

test('loadRuntimeEnv reads env files from caller cwd', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'mtmauto-env-cwd-'));
  const envKey = 'MTMAUTO_TEST_KEY';
  const familyKey = 'MIDSCENE_MODEL_FAMILY';

  try {
    writeFileSync(path.join(tempDir, '.env'), `${envKey}=from-dotenv\n${familyKey}=from-dotenv\n`, 'utf8');
    writeFileSync(path.join(tempDir, '.env.local'), `${envKey}=from-dotenv-local\n`, 'utf8');

    cleanupEnv([envKey, familyKey]);
    loadRuntimeEnv({ cwd: tempDir });

    assert.equal(process.env[envKey], 'from-dotenv-local');
    assert.equal(process.env[familyKey], 'from-dotenv');
  } finally {
    cleanupEnv([envKey, familyKey]);
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('loadRuntimeEnv supports explicit --env-file path relative to cwd', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'mtmauto-env-file-'));
  const envKey = 'MTMAUTO_TEST_KEY';

  try {
    const envDir = path.join(tempDir, 'config');
    const envFilePath = path.join(envDir, 'runtime.env');

    writeFileSync(path.join(tempDir, '.env'), `${envKey}=from-default\n`, 'utf8');
    mkdirSync(envDir, { recursive: true });
    writeFileSync(envFilePath, `${envKey}=from-explicit\n`, { encoding: 'utf8', flag: 'w' });

    cleanupEnv([envKey]);
    loadRuntimeEnv({ cwd: tempDir, envFile: 'config/runtime.env' });

    assert.equal(process.env[envKey], 'from-explicit');
  } finally {
    cleanupEnv([envKey]);
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('loadRuntimeEnv throws when explicit env file does not exist', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'mtmauto-env-missing-'));

  try {
    assert.throws(() => loadRuntimeEnv({ cwd: tempDir, envFile: 'missing.env' }), /不存在/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
