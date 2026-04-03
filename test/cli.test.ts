import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Command } from 'commander';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createCliProgram, isDirectCliInvocation } from '../src/cli/index';

function hasLongOption(command: Command, optionName: string) {
  return command.options.some((option) => option.long === optionName);
}

test('createCliProgram exposes mtmauto root with hongguo command tree', () => {
  const program = createCliProgram();
  const hongguo = program.commands.find((command) => command.name() === 'hongguo');

  assert.equal(program.name(), 'mtmauto');
  assert.ok(hongguo, 'hongguo command should exist');
  assert.equal(hasLongOption(hongguo, '--env-file'), true);

  const runCommand = hongguo.commands.find((command) => command.name() === 'run');
  assert.ok(runCommand, 'hongguo run subcommand should exist');
  assert.equal(hasLongOption(runCommand, '--env-file'), true);
});

test('createCliProgram supports version flag and exits through commander override', async () => {
  const program = createCliProgram();
  let output = '';

  program.configureOutput({
    writeOut: (chunk) => {
      output += chunk;
    },
    writeErr: (chunk) => {
      output += chunk;
    },
  });

  program.exitOverride();

  await assert.rejects(
    () => program.parseAsync(['--version'], { from: 'user' }),
    (error: unknown) => {
      if (!(error instanceof Error)) {
        return false;
      }

      const commandError = error as Error & { code?: string };
      return commandError.code === 'commander.version';
    },
  );

  assert.match(output, /\d+\.\d+\.\d+/);
});

test('isDirectCliInvocation treats symlinked npm bin path as direct execution', () => {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'mtmauto-cli-bin-'));
  const sourceCliPath = fileURLToPath(new URL('../src/cli/index.ts', import.meta.url));
  const symlinkPath = path.join(tempDir, 'mtmauto');

  try {
    symlinkSync(sourceCliPath, symlinkPath);

    assert.equal(isDirectCliInvocation(symlinkPath, pathToFileURL(sourceCliPath).href), true);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
