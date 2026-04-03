import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseForegroundState } from '../src/lib/device';

test('parseForegroundState extracts top resumed activity', () => {
  const state = parseForegroundState(
    'topResumedActivity=ActivityRecord{123 u0 com.phoenix.read/com.dragon.read.pages.main.MainFragmentActivity t12}',
  );

  assert.deepEqual(state, {
    topPackage: 'com.phoenix.read',
    topActivity: 'com.dragon.read.pages.main.MainFragmentActivity',
  });
});

test('parseForegroundState returns empty state when activity is missing', () => {
  const state = parseForegroundState('no resumed activity present');

  assert.deepEqual(state, {
    topPackage: '',
    topActivity: '',
  });
});
