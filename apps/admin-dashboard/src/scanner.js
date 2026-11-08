const SUPPORTED_EXECUTABLE = /\.exe$/i;
const ALLOWED_PREVIEW_RESULTS = new Set(['Suspicious', 'No rules triggered']);

export function validateExecutableFilename(filename) {
  const value = String(filename ?? '').trim();
  if (!value) throw new TypeError('Choose a Windows .exe file.');
  if (!SUPPORTED_EXECUTABLE.test(value)) throw new TypeError('Unsupported file type. Select a Windows .exe file.');
  return value;
}

export function createPreviewScanRecord({ filename, result = 'Suspicious', deviceId = 'LAB-PC-001', id = 'PREVIEW-SCAN', observedAt = new Date().toISOString() } = {}) {
  const safeFilename = validateExecutableFilename(filename);
  if (!ALLOWED_PREVIEW_RESULTS.has(result)) throw new TypeError('Unsupported preview result scenario.');
  const flagged = result === 'Suspicious';
  const reason = flagged
    ? 'Illustrative indicators matched: high section entropy and unusual imports.'
    : 'No illustrative preview indicators matched. This result does not establish that the file is safe.';
  return {
    id,
    device_id: deviceId,
    filename: safeFilename,
    result,
    sha256: null,
    observed_at: observedAt,
    source: 'preview',
    details: { reason, risk: flagged ? 'High' : 'Low', analysis_method: 'Static PE feature analysis', preview_only: true }
  };
}

export function createPreviewScanEvent(scan) {
  if (!scan || !scan.id || !scan.filename || !scan.device_id) throw new TypeError('A complete preview scan record is required.');
  const flagged = scan.result === 'Suspicious';
  return {
    event_id: 'PREVIEW-EVENT-' + scan.id,
    observed_at: scan.observed_at,
    device_id: scan.device_id,
    event_type: flagged ? 'Executable scan flagged for review' : 'Executable scan completed',
    category: 'scan',
    risk: scan.details?.risk || 'unassessed',
    description: scan.filename + ': ' + (scan.details?.reason || 'Preview scan result recorded.'),
    source: 'preview'
  };
}
