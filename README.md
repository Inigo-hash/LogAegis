# LogAegis Dashboard

A lightweight, dependency-free dashboard prototype for LogAegis. The application includes an administrator console and a restricted end-user preview that share the same visual system. The end-user preview provides the Home and Scan History screens based on the paper prototype.

## Included views

1. File Scanner: administrator-only mock .exe scan workflow for preview mode.
2. Overview: events, enrolled devices, scan findings, integrity results, charts.
3. Devices: enrolled endpoints, inspection, administrator device-token revocation.
4. Activity Logs: chronological events, searches, risk filters, record inspection.
5. AI Analysis: explicit model-unverified status and only real risk metadata; no fabricated metrics.
6. Record Integrity: independently checked, per-device HMAC/checkpoint verification and anchor lag.
8. Reports: safe CSV exports and honest pending research metrics.
9. Settings: HTTPS backend URL, authenticated session, audit trail and theme.
10. End-user preview: Home and Scan History screens for standard users.

The UI ships with a clearly labeled **fictional interactive prototype dataset**, matching the V3 description's 6 example devices, 6,399 illustrative events, scan findings, and integrity screen. Prototype mode is strictly separate from live mode.

## Build and run

Requires **Node.js 20+**. There are no third-party npm package dependencies.

```sh
cd apps/admin-dashboard
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:5173` for the admin console or `http://127.0.0.1:5173/user.html` for the end-user preview. File Scanner is the first item in the administrator sidebar. The static build is written to `apps/admin-dashboard/dist/`. On Vercel use project root `apps/admin-dashboard`, build command `npm run build`, output directory `dist`. A custom host should serve `dist/index.html` and `dist/src/*` intact.

## Live backend connection

The default live connection uses **same-origin `/api/v1`**. In Settings, you can enter an explicit HTTPS base URL when the laboratory backend is hosted separately, but the backend must explicitly allow the dashboard origin with appropriate CORS headers. Do not configure `Access-Control-Allow-Origin: *` for a token-protected production backend; use a specific allowed origin and HTTPS. Reverse proxying the authenticated `/api/v1` routes on the same origin is recommended.

Current FastAPI contracts this package expects:

| Route | Purpose |
|---|---|
| `POST /api/v1/admin/login` | Login, returns `access_token` |
| `GET /api/v1/admin/me` | Confirm administrator identity |
| `GET /api/v1/admin/devices` | Returns `{items:[{device_id,enrolled_at,last_sequence}]}` |
| `GET /api/v1/admin/events?limit=200` | Returns `{items:[...]}` |
| `GET /api/v1/admin/scans` | Returns `{items:[...]}` |
| `GET /api/v1/admin/integrity` | Returns `{items:[...]}`; **not** proof of verification by itself |
| `GET /api/v1/admin/integrity/verify/{device_id}` | Verify HMAC chain and independent checkpoint |
| `GET /api/v1/admin/reports/summary` | Returns `{devices,events,scans}` |
| `GET /api/v1/admin/audit?limit=200` | Returns `{items:[...]}` |
| `POST /api/v1/admin/devices/{device_id}/revoke` | Revoke a device's bearer token |

The live UI never assumes a device is online without a heartbeat endpoint; it does not pretend that a model is trained if no model metadata is available. Actual detection-rule explanations require the backend to populate scan `details.reason` or `details.explanation`. Events with no explicit risk fields display **Unassessed**. External checkpoint verification is only marked Verified after calling the backend verify endpoint.

### Security and deployment notes

- Admin bearer token is kept only in current page memory (refresh logs out). No `localStorage` or browser persistence.
- API requests require a token except login; all calls are `no-store` and `credentials:'omit'`.
- Output is HTML-escaped, backend identifiers are URI-encoded, and CSV exports neutralize spreadsheet formulas.
- This is **not** a standalone identity provider; access control remains enforced by the backend.
- The backend is a separate lab service. The public preview must **not** be connected to sensitive student telemetry without a security review and permitted deployment.
- No claim is made that the Windows collector, AI classifier, alert transport, persistent checkpoint worker, or actual lab devices are operating. This dashboard displays only the backend data they supply.
- A real backend/browser integration test, production TLS and CORS configuration, CI of the actual repository, and authorized Vercel deployment still need to be performed.

## Administrator File Scanner preview

The **File Scanner** page is the first item in the administrator sidebar and combines the scan workflow with the complete executable scan history. Administrators can initiate a scan at the top, then search, filter, inspect or export scan records further down the same page.

- In Demo Mode, choose a Windows .exe file and select an illustrative result scenario.

- Click **Scan file** to create a preview scan record and its corresponding endpoint activity event.

- The generated record appears in File Scanner's Scan History, Overview and Activity Logs, scan-detail dialog and CSV exports.

- Preview records are stored only in the current browser session and are not submitted to the live backend.

The file chooser reads only the filename. File contents are not read, uploaded, executed or analyzed. The two preview scenarios are illustrative and are not actual malware assessments. Live mode keeps the mock scan action disabled because the repository does not yet expose an endpoint scanner or a scan-initiation API. Real scanning requires the Windows endpoint component, PE feature extraction, the configured LightGBM model and researcher-defined indicators, plus backend persistence.

The scanner is detection-and-notification only. It does not execute, block, quarantine or delete files, and it does not provide real-time protection.

## Administrator navigation

Executable scan history is integrated into File Scanner rather than exposed as a separate sidebar destination. The File Scanner contains the scan controls, latest result, full scan history, search, risk filtering, detail dialogs and CSV export.

## End-user preview

The user.html page intentionally exposes only **Home** and **Scan History**, matching the end-user paper prototype. It uses sample records (setup.exe and utility.exe) and includes a preview workflow for showing a scan in progress and a flagged result. The end-user interface does not expose administrator scanning controls, centralized activity logs or record-integrity management.

This is a front-end demonstration, not a live endpoint client. The end-user preview does not monitor the Downloads folder, access local files, execute files or call an end-user API. Real end-user authentication, role enforcement, scan-history retrieval and automatic file monitoring remain backend and endpoint-agent work.

## Validation

`npm test` covers risk-label honesty, CSV formula escaping, backend URL HTTPS validation, demo data structure, and unauthorized request prevention. `npm run build` generates the deployment folder. A browser end-to-end smoke test was attempted but blocked by the execution environment's browser network policy; no browser-render verification is claimed.
