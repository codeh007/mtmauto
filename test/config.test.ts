import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveVmosConfig } from '../src/lib/config';

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
