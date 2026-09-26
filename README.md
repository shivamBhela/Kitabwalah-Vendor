# Kitabwalah Vendor Platform

A polished, interactive seller-side marketplace demo. It uses `localStorage` as a deliberate development adapter so every key flow works without third-party credentials. The `db/schema.sql` file and `docs/api-contract.md` provide the production PostgreSQL and REST implementation contract.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. The demo opens on a realistic populated dashboard. Use the profile menu to sign out and exercise the OTP sign-in experience (any six digits other than `000000` verifies the mock OTP).

## Included behaviours

- Vendor-safe data adapter keyed to the active vendor ID
- Product creation, search, filters, city pricing, stock adjustment and bulk CSV validation
- Order progression with permitted state transitions, shipment handover, return state updates and invoice print view
- Earnings, settlement status and withdrawal validation/history
- Review replies, read/unread notifications and threaded support tickets
- Store vacation controls, session controls, profile/security and notification preferences

## Production handoff

The client-side adapter should be replaced with the API endpoints documented in `docs/api-contract.md`. The database schema has scoped foreign keys, indexes, timestamps and status constraints. Never put credentials in the browser; use the supplied environment variable names on the server.
