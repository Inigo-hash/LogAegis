# LogAegis Dashboard

A lightweight, dependency-free dashboard prototype for LogAegis. The application includes an administrator console and a restricted end-user preview that share the same visual system. The end-user preview provides the Home and Scan History screens based on the paper prototype.

## Included views

1. Overview: events, enrolled devices, scan findings, integrity results, charts.
2. Devices: enrolled endpoints, inspection, administrator device-token revocation.
3. Activity Logs: chronological events, searches, risk filters, record inspection.
4. AI Analysis: explicit model-unverified status and only real risk metadata; no fabricated metrics.
5. Executable Scans: search, indicators, SHA-256 and review classifications.
6. Record Integrity: independently checked, per-device HMAC/checkpoint verification and anchor lag.
7. Reports: safe CSV exports and honest pending research metrics.
8. Settings: HTTPS backend URL, authenticated session, audit trail and theme.
9. End-user preview: Home, File Scanner and Scan History screens for standard users.

The UI ships with a clearly labeled **fictional interactive prototype dataset**, matching the V3 description's 6 example devices, 6,399 illustrative events, scan findings, and integrity screen. Prototype mode is strictly separate from live mode.

## Build and run

Requires **Node.js 20+**. There are no third-party npm package dependencies.

```sh
cd apps/admin-dashboard
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:5173` for the admin console, `http://127.0.0.1:5173/user.html` for the end-user preview, or `http://127.0.0.1:5173/user.html#scanner` to open File Scanner directly. The static build is written to `apps/admin-dashboard/dist/`. On Vercel use project root `apps/admin-dashboard`, build command `npm run build`, output directory `dist`. A custom host should serve `dist/index.html` and `dist/src/*` intact.

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

## End-user preview

The `user.html` page exposes **Home**, **File Scanner** and **Scan History**. It uses sample records matching the paper prototype (`setup.exe` and `utility.exe`) and includes a preview workflow for showing a scan in progress and a flagged result. The File Scanner page presents the designated Downloads location, supported Windows `.exe` files, static PE analysis method, proposed LightGBM classifier, researcher-defined indicators and the planned assessment output fields. The admin console includes an **End-user view** shortcut and an admin-console-only **File Scanner Preview** shortcut.

This is a front-end demonstration, not a security boundary or a live endpoint client. The preview does not monitor the Downloads folder, access local files, execute files, or call an end-user API. Scanner model scores, rule scores, final risk levels, triggered indicators and model version remain unavailable until the corresponding analysis components provide actual values. The repository currently documents administrator API routes only. Real end-user authentication, role enforcement, scan-history retrieval, and automatic file monitoring must be implemented by the backend and Windows endpoint agent before this view is used with real laboratory data. The File Scanner page describes detection and notification only; automatic blocking, quarantine and file removal are outside the proposed study scope.

## Validation

`npm test` covers risk-label honesty, CSV formula escaping, backend URL HTTPS validation, demo data structure, and unauthorized request prevention. `npm run build` generates the deployment folder. A browser end-to-end smoke test was attempted but blocked by the execution environment's browser network policy; no browser-render verification is claimed.
