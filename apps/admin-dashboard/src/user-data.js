export const initialUserScans = Object.freeze([
  {
    id: 'SCAN-002',
    filename: 'setup.exe',
    time: '10:10 AM',
    result: 'No rule triggered',
    status: 'Completed',
    method: 'Static file analysis',
    reason: 'No configured detection rule matched the file.',
    notification: 'Not required'
  },
  {
    id: 'SCAN-001',
    filename: 'utility.exe',
    time: '09:50 AM',
    result: 'No rule triggered',
    status: 'Completed',
    method: 'Static file analysis',
    reason: 'No configured detection rule matched the file.',
    notification: 'Not required'
  }
]);

export const previewScanningScan = Object.freeze({
  filename: 'sample.exe',
  progress: 60,
  status: 'Scanning'
});

export function countUserScans(scans, activeScan = null) {
  return {
    completed: scans.filter(scan => scan.status === 'Completed').length,
    flagged: scans.filter(scan => scan.result === 'Flagged for review').length,
    scanning: activeScan ? 1 : 0
  };
}

export function createFlaggedPreviewScan(time = '10:20 AM') {
  return {
    id: 'PREVIEW-SAMPLE',
    filename: 'sample.exe',
    time,
    result: 'Flagged for review',
    status: 'Completed',
    method: 'Static file analysis',
    reason: 'Combined static indicators triggered a detection rule. Illustrative rule explanation.',
    notification: 'Administrator notification sent'
  };
}


export const scannerSpecification = Object.freeze({
  monitoringStatus: 'Preview only — endpoint monitoring is not connected',
  monitoredLocation: 'Designated Downloads folder',
  supportedFileType: 'Windows .exe (Portable Executable)',
  analysisMethod: 'Static PE feature analysis',
  classifier: 'LightGBM classifier (not connected)',
  indicators: 'Researcher-defined static indicators (preview only)',
  execution: 'Files are examined without being executed'
});

export const plannedAssessmentFields = Object.freeze([
  'Model score',
  'Rule score',
  'Final risk level',
  'Triggered indicators',
  'Model version'
]);

export function summarizeScannerResults(scans) {
  return {
    total: scans.filter(scan => scan.status === 'Completed').length,
    flagged: scans.filter(scan => scan.result === 'Flagged for review' || scan.result === 'Suspicious').length,
    noRuleTriggered: scans.filter(scan => scan.result === 'No rule triggered' || scan.result === 'No rules triggered').length
  };
}
