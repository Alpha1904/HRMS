# HRMS Client - Payment & Bonus Module

## Build

From `client/`:

- `npm run build`

The TypeScript sources live in `client/src/assets/js/**` and compile to `client/dist/assets/js/**`.

## Run

This project is a static multi-page app.

- Serve `client/src/` using any static server (e.g. VSCode Live Server).
- Ensure the backend is running.

The client detects the backend base URL at runtime via `detectApiBase()` (see `src/assets/js/fetch.ts`).

- When using Live Server (port 5500/5501), API defaults to `http://localhost:3000/api`.
- Otherwise it uses relative `/api`.

## Payment pages

- `src/payslip.html`
  - Employee: shows your own payslips and allows PDF download.
  - Admin: can view any employee payslip by Profile ID and generate a payslip for a given month.
- `src/payment-compensation.html` (admin only)
  - Create compensation components (base salary, bonuses, incentives) and list by profile.
- `src/payment-adjustments.html` (admin only)
  - Create salary adjustments and list adjustment history by profile.

## Scripts

- `src/assets/js/payment/core.ts`
  - API wrapper, role helpers, shared nav, toast notifications.
- `src/assets/js/payment/payslips.ts`
- `src/assets/js/payment/compensation.ts`
- `src/assets/js/payment/adjustments.ts`
