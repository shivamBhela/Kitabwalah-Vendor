# Kitabwalah — Frontend Integration Guide (Vendor + Admin Web Dashboards)

**Backend base URL:** `https://backend-i4kx.onrender.com`
**Audience:** Frontend developer building the **Vendor** and **Admin** dashboards (web).
**Written by:** Backend team. If anything here doesn't match what you see, ask us — don't guess.

---

## ⚠️ READ THIS FIRST — things that will trip you up

1. **There are TWO separate login systems** with two different tokens. They are NOT interchangeable. (Details in each half.)
2. **Every successful response is wrapped** as `{ "success": true, "data": <payload> }`. In axios you must read `response.data.data`.
3. **There are TWO different error shapes** (see "Errors" below). Write ONE helper to read the message, or you'll print raw arrays to users.
4. **Money is a STRING** with 2 decimals (`"1250.00"`), never a number — except **one** endpoint that takes integer paise (vendor withdrawal). Details where relevant.
5. **Pagination is the same everywhere:** send `?page=1&limit=20`, get back `{ items, page, limit, total, totalPages }`.

### The response envelope (always)
```json
{ "success": true, "data": { ... } }
```
Always unwrap `response.data.data`.

### The two error shapes
**Shape 1 — everything except `/api/auth/*`:**
```json
{ "success": false, "statusCode": 400, "error": "Bad Request",
  "message": ["title must be longer than 2 characters"],
  "path": "/admin/products", "timestamp": "..." }
```
`message` can be a **string OR an array**.

**Shape 2 — admin auth (`/api/auth/*`) only:**
```json
{ "success": false, "statusCode": 400, "message": "identifier must be a string",
  "errors": { "form": ["identifier must be a string"] } }
```

**Write this helper and use it everywhere:**
```js
const errMsg = (e) => {
  const m = e.response?.data?.message;
  return Array.isArray(m) ? m[0] : (m ?? 'Something went wrong');
};
```

### Pagination (identical everywhere)
Request: `?page=1&limit=20` — `page ≥ 1` (default 1), `limit` 1–100 (default 20). `limit > 100` → 400.
Response: `{ "items": [...], "page": 1, "limit": 20, "total": 4116, "totalPages": 206 }`

### Type conventions
- **Money = string, 2 decimals** (`"1250.00"`). Never a float. (Exception: vendor withdrawal request uses integer `amountPaise`.)
- **Dates = ISO-8601 strings.**
- **Enums = lowercase** (`customer`, `pending_review`, `delivery_person`).
- **Query booleans = strings** → send `?isBanned=true`.

---
---

# ══════════ HALF 1 — VENDOR DASHBOARD ══════════

## V-AUTH — How a vendor logs in

Vendors use the **customer auth system** (the same as the mobile app). Guard: `JwtAuthGuard + RolesGuard`. Token: a JWT signed with `JWT_SECRET`, stored in Redis (60-day per-device session).

### Step 1 — Send OTP
```
POST /auth/otp/send
{ "phone": "9876543210", "deviceId": "web-abc123", "purpose": "phone_login" }
```
| Field | Type | Req | Rules |
|---|---|---|---|
| phone | string | ✅ | 10-digit Indian mobile |
| deviceId | string | ✅ | 1–128 chars. **Generate once, store in localStorage, reuse forever.** |
| purpose | enum | ❌ | `phone_login` \| `email_verify` \| `phone_verify` |

### Step 2 — Verify OTP → get token
```
POST /auth/otp/verify
{ "phone": "9876543210", "otp": "123456", "deviceId": "web-abc123",
  "deviceName": "Chrome on Windows" }
```
`otp` = exactly 6 digits. Response:
```json
{ "success": true, "data": {
  "accessToken": "eyJ...", "expiresInSeconds": 5184000,
  "user": { "id": 42, "role": "vendor", "displayName": "...", "phone": "...", "email": null },
  "isNewUser": false } }
```
(Email login and Google OAuth also work and return the same shape — ask us if you need those.)

### Step 3 — Use the token
```
Authorization: Bearer <accessToken>
```
Literal `Bearer`, one space, the token. No cookies.

### Logout
`POST /auth/logout` (this device) or `POST /auth/logout/all`.

### 🔴 CRITICAL VENDOR GOTCHA — registration does NOT make you a vendor
`POST /vendors/register` creates a vendor profile that is **`isActive: false`, `isVerified: false`**, and **leaves the user's role as `customer`**. So immediately after registering, **every other `/vendors/*` route returns 403** until an admin approves the store and promotes the role.

**Your frontend MUST:** after registration, show a **"pending approval"** screen. Do NOT redirect to the dashboard. Check the role via `GET /auth/me` (returns the user incl. `role`) before routing to the vendor dashboard.

---

## V1 — Vendor profile & orders (`/vendors/*`)
All: `Authorization: Bearer <token>`, role must be `vendor`.

### `POST /vendors/register`  (allowed while still role=customer)
| Field | Type | Req | Rules |
|---|---|---|---|
| storeName | string | ✅ | 2–255 |
| storeDescription | string | ❌ | 0–5000 |
| phone | string | ✅ | 10-digit Indian mobile |
| address | string | ✅ | 5–500 |
| city | string | ✅ | 2–100 |
| state | string | ✅ | 2–100 |
| pincode | string | ✅ | exactly 6 digits |
| country | string | ❌ | 2–10 |

Returns `VendorProfileView` + `kycStatus: "not_submitted"`, `applicationStatus: "pending_admin_approval"`. `409` if already registered.

### `GET /vendors/profile` → `VendorProfileView`
```
{ id, storeName, storeSlug, storeDescription, storeLogo, storeBanner, phone,
  address, city, state, pincode, gstin, commissionRate (string), averageRating (string),
  totalReviews, totalOrders, totalProducts, isVerified, vacationMode,
  vacationMessage, isActive, createdAt }
```
`404` if no profile.

### `PUT /vendors/profile` — all fields optional
`storeName` 2–255 · `storeDescription` 0–5000 · `storeLogo` http(s) URL ≤500 (`""` clears) · `vacationMode` boolean · `vacationMessage` 0–500 → `VendorProfileView`

### `GET /vendors/earnings` → `VendorEarningsView`
```
{ totals: { totalEarnings, totalWithdrawn, pendingBalance },
  live:   { grossSales, commissionDeducted, netEarnings, itemCount },
  settlement: { pending, processing, completed, failed, awaitingSettlement } }
```
All money = strings.

### `GET /vendors/orders?status=&page=&limit=`
Each item (this vendor's slice of each order only):
```
{ orderId, orderNumber, orderStatus, paymentStatus, paymentMethod, isCod,
  placedAt, deliveredAt, shipTo: { name, city, state, pincode } | null,
  vendorSubtotal, vendorCommission, vendorEarning, settlementStatus, vendorStatus,
  items: [{ orderItemId, productId, productName, ... }] }
```

### `PUT /vendors/orders/:orderId/items/:itemId/status`
```
{ "status": "confirmed" | "processing" }
```
Only those two values (forward-only). `400` other status · `409` backwards move · `404` not this vendor's item.

### `GET /vendors/products?status=&search=&page=&limit=`
`search` 1–200 chars. Paginated.

---

## V2 — Withdrawals (`/vendors/withdrawals/*`)

### `GET /vendors/withdrawals/balance`
```
{ availableToWithdraw, reserved, totalEarnings, totalWithdrawn,
  minimumRequest, payoutDetailsOnFile: boolean }
```
**Disable the "Request withdrawal" button when `payoutDetailsOnFile === false`.**

### `POST /vendors/withdrawals`
```
{ "amountPaise": 50000 }
```
**⚠️ INTEGER PAISE, not rupees. 50000 = ₹500.** This is the **only** request body in the whole API that uses paise — convert in your form. `400` below minimum · `409` insufficient balance / no payout details.

### `GET /vendors/withdrawals?status=&page=&limit=`
→ `{ id, amount, status, requestedAt, processedAt, paymentReference, adminNote }[]`

---

## V3 — Product create/edit (`/catalog/products/*`)
Shared route with admin. **A vendor must NOT send `vendorId`** (→ 403). A vendor's new/edited product lands in `pending_review`.

### Body fields (create & update)
| Field | Type | Create | Rules |
|---|---|---|---|
| title | string | ✅ | 2–500 |
| regularPrice | string | ✅ | `^\d{1,8}(\.\d{1,2})?$`, GST-inclusive MRP |
| salePrice | string\|null | ❌ | same regex; must be ≤ regularPrice or 400 |
| basePrice | string\|null | ❌ | vendor cost, never shown to customers |
| gstRate | number | ❌ | one of 0, 5, 12, 18, 28 |
| hsnCode | string | ❌ | 0–20 |
| sku | string\|null | ❌ | 1–100, globally unique → 409 |
| isbn | string\|null | ❌ | 1–20 |
| author / publisher / edition / language / binding / genre | string | ❌ | 0–500/255/50/50/50/100 |
| pages | number | ❌ | int 1–100000 |
| bookFormat | enum | ❌ | physical \| audio \| ebook |
| condition | enum | ❌ | new_condition \| like_new \| good \| acceptable \| poor |
| stockQuantity | number | ❌ | int ≥ 0 |
| manageStock | boolean | ❌ | default true |
| inStock | boolean | ❌ | only honoured when manageStock=false; else derived from stockQuantity > 0 |
| weight | string\|null | ❌ | grams, `^\d{1,6}(\.\d{1,2})?$` |
| dimensions | object\|null | ❌ | `{ length, width, height, unit? }` positive numbers |
| status | enum | ❌ | vendor: only `draft` or `pending_review` (else 403) |
| returnable | boolean | ❌ | default true |
| returnWindow | number | ❌ | int 0–90 |
| metaTitle / metaDescription | string | ❌ | 0–255 / 0–1000 |
| categoryIds | number[] | ❌ | ≤20, unique, all must exist (else 400) |

### Endpoints
| Method | Path | Notes |
|---|---|---|
| POST | `/catalog/products` | 201. Vendor's → `pending_review` |
| PUT | `/catalog/products/:id` | **PUT not PATCH.** Omitted key = untouched |
| DELETE | `/catalog/products/:id` | Soft delete → inactive, in_stock=false, idempotent |
| POST | `/catalog/products/:id/images` | `{ imageUrl, isPrimary?, displayOrder? }`, 201 |
| DELETE | `/catalog/products/:id/images/:imageId` | |
| PUT | `/catalog/products/:id/city-prices` | `{ prices: [{ cityId, price }] }` — REPLACE all; `[]` clears; max 50 |

Response = `ProductView` (full field set: id, vendorId, title, slug, prices, gstRate, hsnCode, sku, isbn, author, stock, status, categories[], images[], cityPrices[], approval fields, timestamps).

### 🔴 Re-review rule (warn the vendor!)
A vendor changing **title, regularPrice, salePrice, categoryIds, images, or city prices** on a *live* product sends it back to `pending_review` and clears approval. Responses carry `reReviewTriggered: boolean`. **Warn the vendor before submitting.** (Admin edits never trigger this.)

`404` (not 403) for another vendor's product — deliberate, prevents catalogue enumeration.

### Reading back a rejected product
`GET /catalog/admin/products/:id` — `@Roles(vendor, admin)`, ownership-scoped. The only way a vendor sees a rejected product's `rejectionReason`.

### Vendor shipments
`GET /delivery/vendor/shipments` — `@Roles(vendor)`.

---
---

# ══════════ HALF 2 — ADMIN DASHBOARD ══════════

## A-AUTH — The admin portal login flow (DIFFERENT from vendor)

The admin portal uses its **own** auth system. Guard: `AdminJwtAuthGuard + AdminPermissionsGuard`. Secret: `ADMIN_JWT_ACCESS_SECRET` (deliberately different from the vendor/customer secret).

**Two tokens:**
- **Access token** — JWT, **15 min** lifetime. Send as `Authorization: Bearer <t>`. **Keep in memory/state, NOT localStorage.**
- **Refresh token** — opaque, in an **httpOnly cookie** `kw_refresh_token` (path `/api/auth`, sameSite=strict, secure in prod, 30 days). JS cannot read it. **Your HTTP client must send `withCredentials: true` on every `/api/auth/*` call.**

### Step 1 — Login
```
POST /api/auth/login          (public, rate-limited 5/min per IP)
{ "identifier": "admin@kitabwalah.com", "password": "..." }
```
`identifier` = phone or email. Both fields required. **Branch on `requires2FA`:**

**(a) 2FA enabled:**
```json
{ "success": true, "data": { "requires2FA": true, "pendingToken": "eyJ..." } }
```
`pendingToken` lives 5 min, is only usable at Step 2 (rejected as a Bearer token).

**(b) 2FA not enabled:**
```json
{ "success": true, "data": { "requires2FA": false, "accessToken": "eyJ...",
  "user": { "id": 3, "userCode": "ADM000003", "displayName": "...",
            "role": "admin", "adminRole": "super_admin" } } }
```
The refresh cookie is set via `Set-Cookie`. **The refresh token is NEVER in the JSON body** — by design.

### Step 2 — Verify 2FA (only if `requires2FA: true`)
```
POST /api/auth/2fa/verify-login    (public, 5 attempts / 5 min)
{ "pendingToken": "<from step 1>", "code": "123456" }
```
`code` = 6-digit TOTP **or** one of 8 backup codes. Returns the same shape as (b).

### Step 3 — Use the access token
```
Authorization: Bearer <accessToken>
```

### Step 4 — Refresh (every ~15 min, on 401)
```
POST /api/auth/refresh        (public — authenticated by the COOKIE, no Bearer, withCredentials: true, no body)
→ { "success": true, "data": { "accessToken": "eyJ..." } }
```
**A new refresh cookie is set on every refresh (rotation).** Presenting an already-used refresh token revokes the whole family (theft detection). **Never fire two refreshes in parallel — queue them.**

**Recommended axios interceptor:** on 401 → call `/api/auth/refresh` once → retry original request → if refresh also 401s → redirect to login.

### Step 5 — Logout
```
POST /api/auth/logout   (requires Bearer)  → { "loggedOut": true }
```

### 2FA enrolment (any authenticated admin)
```
POST /api/auth/2fa/setup          → returns TOTP secret / otpauth URI (render as QR)
POST /api/auth/2fa/verify-setup   { "code": "123456" }  → enables it, returns backup codes ONCE
```
**Force the operator to save the backup codes** — shown only once.

### Permissions (RBAC) — read `adminRole` from the login response
| adminRole | Permissions |
|---|---|
| super_admin | all 13 |
| ops | orders, users, analytics, products, vendors, pincodes, delivery, returns, themes |
| finance | analytics_read, audit_read, withdrawals_manage |
| analytics_viewer | analytics_read |
| support | users_manage |

**Hide/disable menu items the role lacks.** Backend returns `403 "Missing required permission: products.manage"` regardless.

**Session dies instantly** if: admin deactivated, user banned, role no longer admin, or token_version bumped (re-checked against DB on every request).

---

## A1 — Products (`/admin/products/*`, permission `PRODUCTS_MANAGE`)

### `GET /admin/products?status=&vendorId=&categoryId=&q=&minPrice=&maxPrice=&order=&page=&limit=`
`q` searches title/sku/isbn/author. `minPrice`/`maxPrice` = money strings on regular_price; inverted range → 400. `order` = asc\|desc (default desc).
Returns paginated + **`statusCounts: { draft, pending_review, active, inactive, rejected }`** (catalog-wide, **ignores your filters** — they're tab badges).
Item: `{ id, title, slug, status, vendor:{id,storeName,storeSlug,isActive}, regularPrice, salePrice, stockQuantity, inStock, categories[], primaryImage, featuredUntil, isFeatured, submittedAt, updatedAt, approvedAt, approvedById, rejectionReason }`

### `POST /admin/products` (201)
Same body as vendor product (V3) **plus `vendorId` required**, **minus `status`** (sending it → 400). Always → `pending_review`.

### `GET /admin/products/:id` → `ProductView` + vendor{} + featuredUntil + isFeatured

### `PATCH /admin/products/:id` — **PATCH** (vendor route is PUT). `status` and `rejectionReason` → 400.

### `DELETE /admin/products/:id` → `{ id, status, previousStatus, changed, message }`

### `PATCH /admin/products/:id/approve` — no body. Stamps approver + clears rejection.
### `PATCH /admin/products/:id/reject` — `{ "rejectionReason": "..." }` required, 5–2000 chars.

### `POST /admin/products/bulk-approve` / `bulk-deactivate` — `{ "ids": [1,2,3] }` (1–200, unique)
**Always 200, partial success:**
```json
{ "requested": 3, "succeeded": 2, "failed": 1,
  "results": [{ "id": 1, "ok": true, "status": "active" },
              { "id": 9, "ok": false, "error": "Product not found" }] }
```
Show a **results modal**, not a toast.

### `PATCH /admin/products/:id/feature` — `{ "days": 30 }` OR `{ "featuredUntil": "2026-12-31T00:00:00Z" }` (both → 400, neither → 30 days; days 1–365; past date → 400)
### `DELETE /admin/products/:id/feature` — idempotent

### City prices
`GET /admin/products/:id/city-prices` · `PUT .../city-prices` (replace all) · `GET .../city-prices/:cityId` (404 if none) · `PUT .../city-prices/:cityId` `{ "price": "249.00" }` (**merge** — leaves other cities alone)

---

## A2 — Users (`/admin/users/*`, permission `USERS_MANAGE`)

### `GET /admin/users?role=&isBanned=&isMigrated=&cityId=&q=&order=&page=&limit=`
`q` searches display_name/phone/email/referral_code.
Item: `{ id, displayName, phone, email, role, walletBalance, isActive, isBanned, banReason, isMigrated, phoneVerified, emailVerified, referralCode, city:{id,name}|null, lastLoginAt, createdAt }`
**`password_hash` and `google_id` are never returned.**

### `GET /admin/users/:id` → list item + firstName, lastName, profilePicture, referredById, migrationLoginDone, updatedAt, savedAddresses[], reseller|null, recentOrders[] (10), walletTransactions[] (10)

### `PATCH /admin/users/:id/ban` — `{ "banReason": "..." }` required, 5–2000 → `{ id, isBanned, banReason, sessionsRevoked }` (all their devices signed out)
### `PATCH /admin/users/:id/unban` — no body

### `POST /admin/users/:id/wallet-adjustment` — REAL MONEY
```json
{ "type": "credit" | "debit", "amount": "100.00", "description": "Goodwill" }
```
`amount` = positive rupee string; **direction comes from `type`, never a minus sign.** Zero → 400. `description` optional 1–500, shown to customer.
→ `{ userId, type, amount, amountPaise, balanceBefore, balanceAfter, transactionId, source, description }`
`409` on debit exceeding balance. **Needs a confirmation dialog** (real money).

---

## A3 — Orders (`/admin/orders/*`, permission `ORDERS_MANAGE`)

### `GET /admin/orders?status=&paymentStatus=&paymentMethod=&deliveryType=&cityId=&vendorId=&dateFrom=&dateTo=&search=&order=&page=&limit=`
Dates ISO-8601; a date-only `dateTo` is extended to end-of-day. `search` = order number, invoice number, customer name/phone/email.
Item: `{ id, orderNumber, invoiceNumber, status, paymentStatus, paymentMethod, deliveryType, isCod, customer:{id,displayName,phone,email,isBanned}, city:{id,name}|null, pincode, total, refundAmount, refundableAmount, couponCode, itemCount, vendorIds[], placedAt, deliveredAt, cancelledAt, refundedAt }`

### `GET /admin/orders/:id` → list item + full money breakdown (subtotal, shippingAmount, codCharge, discountAmount, gstAmount, shippingGstAmount, platformFee, walletAmountUsed), customerNote, cancellationReason, gateway ids, items[], addresses[], shipments[], walletTransactions[], couponUsages[], returnRequests[], **timeline[]**, timelineTruncated

### `GET /admin/orders/:id/invoice-number` → `{ orderId, orderNumber, invoiceNumber, persisted, paymentStatus }`

### `PATCH /admin/orders/:id/status` — `{ "status": "shipped", "note": "..." }`
Allowed: confirmed, processing, shipped, out_for_delivery, delivered, return_requested, returned. **`cancelled` → 400 (use `/cancel`).** `note` 1–500, audit only.
→ `{ id, orderNumber, previousStatus, status, deliveredAt, cancelledAt, settlement|null }`

### `POST /admin/orders/:id/refund` — partial refund
```json
{ "amount": "150.00", "method": "wallet" | "original_payment", "reason": "..." }
```
`method` required (no default). Capped at `total − alreadyRefunded` → 409 if over. Zero → 400.
→ `{ ..., settled, walletTransactionId, message }`
**⚠️ `settled: true` only for `wallet`.** `original_payment` is **recorded only — no gateway-refund integration exists**, so money has NOT actually moved. Show the operator this clearly.

### `PATCH /admin/orders/:id/cancel` — `{ "cancellationReason": "..." }` required, 5–500. Always refunds via original_payment.
→ `{ id, orderNumber, status, cancellationReason, cancelledAt, refund:{...}|null }`

---

## A4 — LEGACY admin modules (🔴 DIFFERENT TOKEN)

**These use the CUSTOMER token with `role=admin` (`JWT_SECRET`), NOT the portal token.** Your portal access token will **401** here. You need a **second token**, obtained via the **vendor/customer OTP flow (V-AUTH)** using an admin account. This is the biggest architectural point — see the note in "What's new" below.

| Module | Base | Controller | Endpoints |
|---|---|---|---|
| Coupons | `/admin/coupons` | `coupons/admin-coupons.controller.ts` | POST · GET (`?q=&status=&type=&isActive=&isUserSpecific=&order=&page=&limit=`) · GET /:id · PUT /:id · DELETE /:id (soft) · POST /:id/assign `{userId, expiresAt?}` |
| Delivery | `/admin/delivery` | `delivery/admin-delivery.controller.ts` | POST/GET /shipments · GET /shipments/:id · POST /shipments/:id/assign · PUT /shipments/:id/status · GET /courier/status · POST /shipments/:id/dispatch · POST /shipments/reconcile · POST /shipments/:id/manual-handover · POST/GET /persons · PUT /persons/:id · PUT /persons/:id/availability |
| Returns | `/admin/returns` | `delivery/admin-returns.controller.ts` | GET · GET /:id · PUT /:id/status · POST /:id/pickup |
| Withdrawals | `/admin/withdrawals` | `vendors/admin-withdrawals.controller.ts` | GET · PUT /:id/status `{status, paymentReference?, adminNote?}` · POST /settle-earnings · GET /vendors/:vendorId/reconciliation |
| Catalog admin | `/catalog/admin` | `catalog/admin.controller.ts` | GET /products · GET /products/:id · GET /categories |
| Categories write | `/catalog/categories` | `catalog/categories.controller.ts` | POST · PUT /:id |

**Coupon create body:** `{ code (3–50, uppercased, unique), description?, type: "percentage"|"fixed_amount", value (money string), minOrderAmount?, maxDiscountAmount?, usageLimit?, perUserLimit?, isUserSpecific?, isActive?, startsAt?, expiresAt? }`
**Withdrawal status:** pending|approved|processing|completed|rejected. `completed` requires `paymentReference`. Rejection returns reserved amount. The list is the **only** place bank/UPI details are exposed.
**Returns PUT /:id/status:** `approved` fixes the refund figure (no money moves) · `completed` = money actually moves (once) · `rejected` = terminal.

*(Ask the backend team if you need field-by-field detail on any legacy module — the above is a summary.)*

---
---

# ══════════ WHAT'S NEW — things the existing admin frontend does NOT have yet ══════════

The original `kitabwalah-admin` frontend was built against **Wave 1 (auth only)** and used **mock data** for users/orders/vendors. Here's what changed on the backend that the frontend must now build. Ranked by effort.

**🔴 1. Three entire new modules (26 endpoints):** `/admin/products` (15), `/admin/users` (5), `/admin/orders` (6). All the product/user/order admin screens need building for real (were mock).

**🔴 2. The dual-token problem (biggest architectural change):** The portal now needs TWO tokens at once — the **portal access token** for `/admin/products|users|orders`, and a **customer admin token** for `/admin/coupons|delivery|returns|withdrawals` and `/catalog/admin`. If the old app used one axios instance with one token, it needs **two clients keyed by URL prefix.**

**🟠 3. Error-shape inconsistency:** `/api/auth/*` uses `{message, errors}`; the new modules use `{statusCode, error, message, path}` where `message` may be an array. Use the `errMsg` helper (top of doc) or you'll print raw arrays.

**🟠 4. PATCH vs PUT:** New admin product/user/order writes are **PATCH**; the vendor catalog path is **PUT**. Easy to mix up.

**🟠 5. New concepts with no existing UI:**
- Bulk actions with **partial-success arrays** (`results[]` with per-row ok/error) → needs a results modal, not a toast.
- **Product featuring** (`featured_until` expiry, `days` XOR `featuredUntil`) → new merchandising screen.
- **Per-city pricing** (4 cities, replace-vs-merge semantics) → new editor.
- **Wallet adjustment** → real money, confirmation UX.
- **Partial refunds** with `refundableAmount` ceiling and the `settled:false` caveat for original_payment (money didn't actually move).
- **Order timeline** (`timeline[]` + `timelineTruncated`) → derived, not a stored log.
- **statusCounts** tab badges that ignore active filters.

**🟠 6. Permission-driven navigation:** `adminRole` + the 13-permission map is new — hide/disable UI by permission.

**🟡 7. 2FA enrolment flow:** `setup → QR → verify-setup → show backup codes once`. If the old app only handled verify-login, enrolment is missing.

**🟡 8. Vendor-side gaps:**
- The **`pending_admin_approval`** state — registration doesn't grant vendor role; needs a waiting screen.
- **`amountPaise`** on withdrawal requests — the only paise field in any request body.
- **`reReviewTriggered`** — warn vendors that editing a live product delists it pending re-approval.
- **`payoutDetailsOnFile: false`** — disable the withdrawal button.

**🟡 9. Data realities that will look like bugs (from migration):**
- `gstRate = 0` and `hsnCode = null` on all products currently (GST derivation pending).
- `weight`/`dimensions` null on all products.
- Migrated orders: `paymentMethod: "cod"` (now with correct `isCod`).
- Some users have neither phone nor email (guest orders).
**Build the UI to tolerate nulls** rather than assuming clean data.

---

*This guide is split into Vendor and Admin halves for clarity. If a response shape here differs from what you actually receive, tell the backend team — a few vendor list/response shapes were read from mapping code rather than declared types and are best confirmed with one live call.*
