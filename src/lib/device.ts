import { spawn } from 'node:child_process';
import process from 'node:process';
import { AndroidAgent, AndroidDevice, getConnectedDevices } from '@midscene/android';
import { DEMO_SERIAL, VMOS } from './config';

export interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export interface ForegroundState {
  topPackage: string;
  topActivity: string;
}

export function logStep(message: string) {
  console.log(`\n[mtm-auto] ${message}`);
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function runCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    allowFailure?: boolean;
  } = {},
) {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (options.allowFailure || code === 0) {
        resolve({ code, stdout, stderr });
        return;
      }

      reject(
        new Error(
          [`${command} ${args.join(' ')} 失败，退出码 ${code}`, stdout.trim(), stderr.trim()]
            .filter(Boolean)
            .join('\n'),
        ),
      );
    });
  });
}

export async function tryAdbConnect() {
  const result = await runCommand('adb', ['connect', DEMO_SERIAL], { allowFailure: true });
  const combined = `${result.stdout}\n${result.stderr}`;
  return /connected to|already connected to/i.test(combined);
}

export async function ensureSshTunnel() {
  logStep('尝试建立云手机 SSH 隧道');
  const result = await runCommand(
    'sshpass',
    [
      '-e',
      'ssh',
      '-o',
      'HostKeyAlgorithms=+ssh-rsa',
      '-o',
      'StrictHostKeyChecking=no',
      '-o',
      'UserKnownHostsFile=/dev/null',
      '-o',
      'ServerAliveInterval=30',
      '-o',
      'ServerAliveCountMax=3',
      `${VMOS.sshUser}@${VMOS.sshHost}`,
      '-p',
      VMOS.sshPort,
      '-L',
      `${VMOS.localAdbPort}:${VMOS.remoteAdbHost}:${VMOS.remoteAdbPort}`,
      '-Nf',
    ],
    {
      allowFailure: true,
      env: {
        SSHPASS: VMOS.sshPassword,
      },
    },
  );

  const combined = `${result.stdout}\n${result.stderr}`.trim();
  if (result.code === 0 || /address already in use/i.test(combined)) {
    return;
  }

  throw new Error(`SSH 隧道建立失败：\n${combined}`);
}

export async function ensureAdbReady() {
  logStep('检查 adb 连接');
  if (await tryAdbConnect()) {
    return;
  }

  await ensureSshTunnel();
  await sleep(2_000);

  if (!(await tryAdbConnect())) {
    throw new Error(`无法连接 adb 设备 ${DEMO_SERIAL}`);
  }

  const devices = await runCommand('adb', ['devices']);
  if (!devices.stdout.includes(DEMO_SERIAL)) {
    throw new Error(`adb devices 中未发现目标设备 ${DEMO_SERIAL}`);
  }
}

export async function launchAndroidApp(packageName: string, activityName: string) {
  logStep(`启动 ${packageName}/${activityName}`);
  await runCommand('adb', ['-s', DEMO_SERIAL, 'shell', 'am', 'start', '-W', '-S', '-n', `${packageName}/${activityName}`]);
  await sleep(5_000);
}

export async function createAndroidAgent(aiActionContext: string) {
  const devices = await getConnectedDevices();
  const selectedDevice = devices.find((device) => device.udid.includes(DEMO_SERIAL)) ?? devices[0];

  if (!selectedDevice) {
    throw new Error('Midscene 未发现任何 Android 设备，请先确认 adb connect 是否成功');
  }

  logStep(`Midscene 已发现设备：${selectedDevice.udid}`);

  const device = new AndroidDevice(selectedDevice.udid, {
    keyboardDismissStrategy: 'back-first',
  });
  await device.connect();

  return new AndroidAgent(device, {
    aiActionContext,
  });
}

export function parseForegroundState(output: string): ForegroundState {
  const patterns = [
    /topResumedActivity=ActivityRecord\{[^}]*\s([\w.]+)\/([\w.$]+)\s/,
    /ResumedActivity:\s+ActivityRecord\{[^}]*\s([\w.]+)\/([\w.$]+)\s/,
  ];

  for (const pattern of patterns) {
    const matched = output.match(pattern);
    if (matched) {
      return {
        topPackage: matched[1],
        topActivity: matched[2],
      };
    }
  }

  return {
    topPackage: '',
    topActivity: '',
  };
}

export async function readForegroundState() {
  const result = await runCommand('adb', ['-s', DEMO_SERIAL, 'shell', 'dumpsys', 'activity', 'activities']);
  return parseForegroundState(result.stdout);
}
