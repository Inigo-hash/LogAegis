import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialUserScans,
  previewScanningScan,
  countUserScans,
  createFlaggedPreviewScan
} from '../src/user-data.js';

test('end-user preview starts with the two completed scans from the paper prototype', () => {
  assert.deepEqual(countUserScans(initialUserScans), {
    completed: 2,
    flagged: 0,
    scanning: 0
  });
  assert.deepEqual(initialUserScans.map(scan => scan.filename), ['setup.exe', 'utility.exe']);
  assert.ok(initialUserScans.every(scan => scan.result === 'No rule triggered'));
});

test('preview scan state increments the scanning count without changing completed scans', () => {
  assert.deepEqual(countUserScans(initialUserScans, previewScanningScan), {
    completed: 2,
    flagged: 0,
    scanning: 1
  });
});

test('a completed flagged preview scan is counted for review', () => {
  const flagged = createFlaggedPreviewScan();
  assert.equal(flagged.filename, 'sample.exe');
  assert.equal(flagged.result, 'Flagged for review');
  assert.deepEqual(countUserScans([flagged, ...initialUserScans]), {
    completed: 3,
    flagged: 1,
    scanning: 0
  });
});
