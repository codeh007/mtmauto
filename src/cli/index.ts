#!/usr/bin/env node

import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { runHongguoDemo } from '../demo.js';

interface HongguoCommandOptions {
  envFile?: string;
}

function readPackageVersion() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const packageJsonPath = path.resolve(path.dirname(currentFilePath), '../../package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string };
    return packageJson.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function runHongguoCommand(options: HongguoCommandOptions) {
  await runHongguoDemo({
    cwd: process.cwd(),
    envFile: options.envFile,
  });
}

export function createCliProgram() {
  const program = new Command();

  program
    .name('mtmauto')
    .description('Midscene Android cloud-phone automation CLI')
    .version(readPackageVersion(), '-v, --version', 'display version');

  const hongguoCommand = program
    .command('hongguo')
    .description('Run Hongguo minimal business flow')
    .option('--env-file <path>', 'path to a dotenv file (absolute or relative to current working directory)')
    .action(runHongguoCommand);

  hongguoCommand
    .command('run')
    .description('Run Hongguo minimal business flow')
    .option('--env-file <path>', 'path to a dotenv file (absolute or relative to current working directory)')
    .action(runHongguoCommand);

  program.showHelpAfterError();
  return program;
}

export async function main(argv: string[] = process.argv.slice(2)) {
  const program = createCliProgram();
  if (argv.length === 0) {
    program.outputHelp();
    return;
  }

  await program.parseAsync(argv, { from: 'user' });
}

function resolveRealPath(filePath: string) {
  return realpathSync(path.resolve(filePath));
}

export function isDirectCliInvocation(argvEntry = process.argv[1], moduleUrl = import.meta.url) {
  if (!argvEntry) {
    return false;
  }

  try {
    const currentFilePath = resolveRealPath(fileURLToPath(moduleUrl));
    const executedPath = resolveRealPath(argvEntry);
    return executedPath === currentFilePath;
  } catch {
    return false;
  }
}

if (isDirectCliInvocation()) {
  main().catch((error) => {
    console.error('\n[mtmauto] 运行失败');
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
