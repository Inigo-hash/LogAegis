import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExecutableFilename, createPreviewScanRecord, createPreviewScanEvent } from '../src/scanner.js';

test('only Windows .exe filenames are accepted for the scanner preview', () => {
  assert.equal(validateExecutableFilename('setup.exe'), 'setup.exe');
  assert.equal(validateExecutableFilename('PROGRAM.EXE'), 'PROGRAM.EXE');
  assert.throws(() => validateExecutableFilename('document.pdf'), /Windows \.exe/);
  assert.throws(() => validateExecutableFilename(''), /Choose a Windows/);
});

test('flagged preview scan creates an explicit illustrative assessment', () => {
  const scan = createPreviewScanRecord({ filename: 'sample.exe', result: 'Suspicious', id: 'PREVIEW-1', observedAt: '2026-11-08T10:00:00.000Z' });
  assert.equal(scan.filename, 'sample.exe');
  assert.equal(scan.result, 'Suspicious');
  assert.equal(scan.details.risk, 'High');
  assert.equal(scan.details.preview_only, true);
  assert.equal(scan.sha256, null);
  assert.match(scan.details.reason, /Illustrative indicators/);
});

test('no-rule preview scan remains explicitly non-conclusive', () => {
  const scan = createPreviewScanRecord({ filename: 'installer.exe', result: 'No rules triggered', id: 'PREVIEW-2', observedAt: '2026-11-08T10:01:00.000Z' });
  assert.equal(scan.details.risk, 'Low');
  assert.match(scan.details.reason, /does not establish that the file is safe/);
});

test('a preview scan produces a matching activity event for other admin views', () => {
  const scan = createPreviewScanRecord({ filename: 'sample.exe', result: 'Suspicious', id: 'PREVIEW-3', observedAt: '2026-11-08T10:02:00.000Z' });
  const event = createPreviewScanEvent(scan);
  assert.equal(event.device_id, scan.device_id);
  assert.equal(event.category, 'scan');
  assert.equal(event.risk, scan.details.risk);
  assert.equal(event.event_id, 'PREVIEW-EVENT-' + scan.id);
});
