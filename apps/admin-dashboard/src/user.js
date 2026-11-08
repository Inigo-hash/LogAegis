import {
  initialUserScans,
  previewScanningScan,
  countUserScans,
  createFlaggedPreviewScan,
} from './user-data.js';

const root = document.getElementById('app');
const NAV = [
  ['home', '⌂', 'Home'],
  ['history', '▤', 'Scan History']
];
const descriptions = {
  home: 'View the scan status and recent checks for this computer.',
  history: 'Review the results of completed executable scans.'
};
const state = {
  page: 'home',
  query: '',
  result: 'all',
  scans: initialUserScans.map(scan => ({ ...scan })),
  activeScan: null,
  selected: null,
  menu: false
};

const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[char]);

const badge = result => {
  const value = String(result || 'Unassessed');
  const tone = value === 'Flagged for review' ? 'warning'
    : value === 'No rule triggered' ? 'success'
    : value === 'Scanning' ? 'neutral' : 'neutral';
  return '<span class="pill pill-' + tone + '"><span class="pill-dot"></span>' + h(value) + '</span>';
};

const metric = (label, value, icon, note) =>
  '<article class="metric card">' +
    '<div class="metric-top"><span>' + h(label) + '</span><span class="metric-icon">' + icon + '</span></div>' +
    '<div class="metric-number">' + h(value) + '</div>' +
    '<div class="metric-note">' + h(note) + '</div>' +
  '</article>';

const section = (title, subtitle, content, action = '') =>
  '<section class="card section">' +
    '<div class="section-title"><div><h2>' + h(title) + '</h2>' +
    (subtitle ? '<p>' + h(subtitle) + '</p>' : '') +
    '</div>' + action + '</div>' + content +
  '</section>';

function pageHeader(title, description, action = '') {
  return '<div class="page-header">' +
    '<div><div class="eyebrow">END-USER WORKSPACE / ' + h(title.toUpperCase()) + '</div>' +
    '<h1>' + h(title) + '</h1><p>' + h(description) + '</p></div>' +
    '<div class="header-actions">' + action + '</div>' +
  '</div>';
}

function makeTable(columns, rows, emptyMessage) {
  if (!rows.length) {
    return '<div class="empty"><div class="empty-icon">◎</div><strong>No scans found</strong><p>' + h(emptyMessage) + '</p></div>';
  }
  return '<div class="table-scroll"><table><thead><tr>' +
    columns.map(column => '<th scope="col">' + h(column.label) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(row => '<tr>' + columns.map(column =>
      '<td>' + (column.render ? column.render(row) : h(row[column.key] ?? '—')) + '</td>'
    ).join('') + '</tr>').join('') +
    '</tbody></table></div>';
}

function previewBanner() {
  return '<div class="demo-banner user-prototype-banner">' +
    '<span class="banner-icon">◈</span><div>' +
    '<strong>END-USER PROTOTYPE · PREVIEW DATA</strong>' +
    '<span>Sample records only. This page does not monitor Downloads or inspect files on this computer.</span>' +
    '</div></div>';
}

function scanDetailsButton(scan) {
  return '<button class="row-btn" data-action="view-result" data-id="' + h(scan.id) + '">View result</button>';
}

function homePage() {
  const counts = countUserScans(state.scans, state.activeScan);
  const action = '<button class="btn" data-action="preview-scan">＋ Preview new download</button>';
  const currentContent = state.activeScan
    ? '<div class="scan-progress-card" aria-live="polite">' +
        '<div class="scan-progress-heading"><strong>Current scan: ' + h(state.activeScan.filename) + '</strong><strong>' + h(state.activeScan.progress) + '%</strong></div>' +
        '<div class="scan-progress-track" role="progressbar" aria-label="Preview scan progress" aria-valuenow="' + h(state.activeScan.progress) + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + h(state.activeScan.progress) + '%"></span></div>' +
        '<div class="scan-progress-copy"><strong>Scanning...</strong><span>File is examined without being executed.</span></div>' +
        '<div class="scan-preview-actions"><button class="btn" data-action="complete-preview">Complete preview scan</button><button class="btn secondary" data-action="cancel-preview">Cancel</button></div>' +
      '</div>'
    : '<div class="scan-idle-state"><span class="scan-idle-ring" aria-hidden="true"></span><div><strong>No scan in progress</strong><p>A new scan will appear here when an .exe file is detected by the endpoint monitor.</p></div></div>' +
      '<div class="scan-preview-footnote">The button above simulates this workflow for the prototype; it does not download or scan a file.</div>';

  const recent = makeTable([
    { label: 'File', render: scan => '<strong>' + h(scan.filename) + '</strong>' },
    { label: 'Result', render: scan => badge(scan.result) },
    { label: 'Action', render: scan => scanDetailsButton(scan) }
  ], state.scans.slice(0, 3), 'Completed scans will appear here.');

  return pageHeader(
    'Downloaded File Checks',
    'When endpoint monitoring is connected, new .exe files in the monitored Downloads folder will be scanned automatically.',
    action
  ) +
  '<div class="metric-grid three">' +
    metric('Completed', String(counts.completed), '▣', 'Completed scans in this session') +
    metric('Flagged', String(counts.flagged), '⚑', 'Files requiring administrator review') +
    metric('Scanning', String(counts.scanning), '◌', 'Scans currently in progress') +
  '</div>' +
  section('Current scan', 'Status of the most recent file check', currentContent) +
  section('Recent scans (current session)', 'Your latest completed file checks', recent,
    '<button class="link-btn" data-page="history">View scan history →</button>') +
  '<div class="info-panel user-safety-note"><strong>Understanding scan results</strong>' +
    '<p><b>No rule triggered</b> means no configured detection rule matched. It does not guarantee that a file is safe. ' +
    '<b>Flagged for review</b> means do not open the file until an administrator has reviewed it.</p></div>';
}


function historyPage() {
  let rows = state.scans.slice();
  const query = state.query.trim().toLowerCase();
  if (query) rows = rows.filter(scan =>
    (scan.filename + ' ' + scan.result + ' ' + scan.reason).toLowerCase().includes(query)
  );
  if (state.result !== 'all') rows = rows.filter(scan => scan.result === state.result);

  const scansTable = makeTable([
    { label: 'Time', key: 'time' },
    { label: 'File', render: scan => '<strong>' + h(scan.filename) + '</strong>' },
    { label: 'Result', render: scan => badge(scan.result) },
    { label: 'Action', render: scan => scanDetailsButton(scan) }
  ], rows, 'Try a different filename or result filter.');

  return pageHeader('Scan History', descriptions.history) +
    section('Completed scans', 'Results recorded for this end-user session',
      '<div class="filter-row user-filter-row">' +
        '<label class="sr-only" for="scan-search">Search scan history</label>' +
        '<input id="scan-search" class="input" type="search" placeholder="Search filename..." value="' + h(state.query) + '" />' +
        '<label class="sr-only" for="result-filter">Filter by result</label>' +
        '<select id="result-filter" aria-label="Filter by result">' +
          '<option value="all"' + (state.result === 'all' ? ' selected' : '') + '>All results</option>' +
          '<option value="No rule triggered"' + (state.result === 'No rule triggered' ? ' selected' : '') + '>No rule triggered</option>' +
          '<option value="Flagged for review"' + (state.result === 'Flagged for review' ? ' selected' : '') + '>Flagged for review</option>' +
        '</select><span>' + rows.length + ' scan(s)</span>' +
      '</div>' + scansTable
    ) +
    '<div class="info-panel user-safety-note"><strong>Review flagged files carefully</strong>' +
      '<p>A flagged result is a request for administrator review, not a confirmed malware verdict. A result with no triggered rule is not a guarantee of safety.</p></div>';
}

function modal() {
  if (!state.selected) return '';
  const scan = state.scans.find(item => item.id === state.selected);
  if (!scan) return '';
  const flagged = scan.result === 'Flagged for review';
  return '<div class="modal-shade user-modal-shade" data-action="close-modal">' +
    '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="scan-result-title">' +
      '<div class="modal-head"><div><div class="eyebrow">FILE CHECK DETAILS</div><h2 id="scan-result-title">Scan Result</h2></div>' +
      '<button class="icon-button" data-action="close-modal" aria-label="Close scan result">×</button></div>' +
      '<dl class="detail-grid">' +
        '<div><dt>File</dt><dd>' + h(scan.filename) + '</dd></div>' +
        '<div><dt>Status</dt><dd>' + badge(scan.result) + '</dd></div>' +
        '<div><dt>Method</dt><dd>' + h(scan.method) + '</dd></div>' +
        '<div><dt>Scan time</dt><dd>' + h(scan.time) + '</dd></div>' +
        '<div><dt>Reason</dt><dd>' + h(scan.reason) + '</dd></div>' +
      '</dl>' +
      (flagged
        ? '<div class="user-alert-detail"><strong>Administrator notification: Sent</strong><p>A rule was triggered. Avoid opening this file until it has been reviewed by the administrator.</p></div>'
        : '<div class="user-result-detail"><strong>No rule triggered</strong><p>No configured detection rule matched this file. This result does not guarantee that the file is safe.</p></div>') +
      '<div class="modal-actions"><button class="btn secondary" data-action="close-modal">Close</button></div>' +
    '</section></div>';
}

function pageContent() {
  return state.page === 'history' ? historyPage() : homePage();
}

function bindFilters() {
  const search = root.querySelector('#scan-search');
  if (search) search.addEventListener('input', event => {
    const caret = event.target.selectionStart;
    state.query = event.target.value;
    const content = root.querySelector('.user-page-view');
    if (content) content.innerHTML = historyPage();
    bindFilters();
    const next = root.querySelector('#scan-search');
    if (next) {
      next.focus();
      next.setSelectionRange(caret, caret);
    }
  });

  const result = root.querySelector('#result-filter');
  if (result) result.addEventListener('change', event => {
    state.result = event.target.value;
    const content = root.querySelector('.user-page-view');
    if (content) content.innerHTML = historyPage();
    bindFilters();
  });
}

function render() {
  const current = NAV.find(item => item[0] === state.page) || NAV[0];
  root.innerHTML =
    '<div class="shell user-shell">' +
      '<aside class="sidebar">' +
        '<div class="brand"><span class="brand-mark">◇</span><div><strong>LogAegis</strong><small>ENDPOINT MONITORING</small></div></div>' +
        '<div class="side-group">MY WORKSPACE</div>' +
        '<nav aria-label="End-user navigation">' +
          NAV.map(item =>
            '<button data-page="' + item[0] + '" class="nav-link ' + (state.page === item[0] ? 'active' : '') + '"' +
            (state.page === item[0] ? ' aria-current="page"' : '') + '><span class="nav-icon">' + item[1] + '</span><span>' + item[2] + '</span></button>'
          ).join('') +
        '</nav>' +
        '<div class="sidebar-bottom">' +
          '<div class="side-support user-role-card"><div class="support-circle">U</div><div><strong>Standard user</strong><small>Scan and review access</small></div></div>' +
          '<div class="side-user"><div class="user-avatar">U</div><div><strong>LAB-PC-07</strong><small>End-user preview</small></div></div>' +
        '</div>' +
      '</aside>' +
      '<div class="main-wrap">' +
        '<header class="topbar"><div class="top-left">' +
          '<button class="mobile-menu" data-action="menu" aria-label="Toggle navigation">☰</button>' +
          '<div class="breadcrumb">End-user workspace <span>/</span> ' + current[2] + '</div>' +
        '</div><div class="top-right">' +
          '<span class="user-role-pill">STANDARD USER</span>' +
          '<span class="top-date">◷ ' + h(new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })) + '</span>' +
          '<a class="btn secondary admin-switch" href="./index.html">Admin dashboard</a>' +
        '</div></header>' +
        '<main class="content">' + previewBanner() + '<div class="user-page-view">' + pageContent() + '</div></main>' +
        '<footer class="footer">LogAegis · Downloaded File Checks <span>End-user prototype · Static file analysis workflow</span></footer>' +
      '</div>' +
      (state.menu ? '<div class="sidebar-overlay" data-action="menu"></div>' : '') +
      modal() +
      '<div id="toast" role="status" aria-live="polite"></div>' +
    '</div>';

  root.querySelector('.sidebar')?.classList.toggle('open', state.menu);
  bindFilters();
}

root.addEventListener('click', event => {
  const page = event.target.closest('[data-page]');
  if (page) {
    state.page = page.dataset.page;
    state.query = '';
    state.result = 'all';
    state.selected = null;
    state.menu = false;
    render();
    return;
  }

  const button = event.target.closest('[data-action]');
  if (!button) return;
  switch (button.dataset.action) {
    case 'menu':
      state.menu = !state.menu;
      render();
      break;
    case 'preview-scan':
      if (!state.activeScan) state.activeScan = { ...previewScanningScan };
      render();
      break;
    case 'complete-preview': {
      const scan = createFlaggedPreviewScan(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      state.scans.unshift(scan);
      state.activeScan = null;
      state.selected = scan.id;
      render();
      break;
    }
    case 'cancel-preview':
      state.activeScan = null;
      render();
      break;
    case 'view-result':
      state.selected = button.dataset.id;
      render();
      break;
    case 'close-modal':
      if (event.target === button || button.classList.contains('icon-button') || button.classList.contains('modal-actions')) {
        state.selected = null;
        render();
      }
      break;
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.selected) {
    state.selected = null;
    render();
  }
});

render();
