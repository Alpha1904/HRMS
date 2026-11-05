# Payment & Bonus Module - Usage

## Authentication

- Log in using `login.html`.
- The frontend stores the JWT access token as `accessToken` in `sessionStorage` (and caches `currentUserId` / `currentUserRole` in `localStorage`).

If a request returns `401`, the app redirects to `login.html`.

## Employee: View / download payslips

1. Open `payslip.html`.
2. Click `Load last 12 months`.
3. Use `Download PDF` on a row.

Notes:
- Employees can only access payslips for their own profile. If you try a different profile id you will get `403`.

## Admin: Generate payslip

1. Open `payslip.html`.
2. Enter `Employee Profile ID`.
3. Select a `Month`.
4. Click `Generate`.

Then click `Download PDF`.

## Admin: Add compensation component

1. Open `payment-compensation.html`.
2. Search and select a profile (or type `Profile ID`).
3. Click `Add component`.
4. Fill fields and submit.
5. Click `Load components` to refresh.

## Admin: Add salary adjustment

1. Open `payment-adjustments.html`.
2. Search and select a profile (or type `Profile ID`).
3. Click `Add adjustment`.
4. Optionally select a component to link the adjustment.
5. Fill fields and submit.
6. Click `Load adjustments` to refresh.
