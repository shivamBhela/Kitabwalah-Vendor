# Kitabwalah Backend — Admin & Vendor API Reference

**Base URL:** `https://backend-i4kx.onrender.com`
**Project:** `kitabwalah-backend` (NestJS + Prisma + PostgreSQL/Neon)

> ⚠️ **Two auth systems on the admin side.** The new admin portal (`/api/auth/*`, `/admin/products`, `/admin/users`, `/admin/orders`) uses the **admin-portal token** (`AdminJwtAuthGuard`, `ADMIN_JWT_ACCESS_SECRET`, TOTP 2FA, permission RBAC). The legacy admin routes (`/admin/coupons`, `/admin/delivery`, `/admin/returns`, `/admin/withdrawals`, `/catalog/admin`) use the **customer token with role=admin** (`JwtAuthGuard` + `@Roles(admin)`, `JWT_SECRET`). An admin-portal token cannot call legacy routes and vice versa — the frontend needs **two token flows** until the legacy six are migrated.

---

# PART A — ADMIN SURFACE

## Shared infrastructure (new admin portal)

| Component | File |
|---|---|
| Auth guard | `src/admin/common/guards/admin-jwt-auth.guard.ts:19` (`AdminJwtAuthGuard`, `admin-jwt` strategy) |
| RBAC guard | `src/admin/common/guards/admin-permissions.guard.ts:24` (`AdminPermissionsGuard`) |
| Permission enum | `src/admin/auth/rbac/permissions.ts:18-32` (13 values) + `ROLE_PERMISSIONS:37` |
| `@RequirePermission` | `src/admin/common/decorators/require-permission.decorator.ts:11` |
| `@CurrentAdmin` | `src/admin/common/decorators/current-admin.decorator.ts:15` |
| `@AdminPublic` | `src/admin/common/decorators/admin-public.decorator.ts` |
| Audit service | `src/admin/audit/admin-audit.service.ts:29` |
| AuthUser bridge | `src/admin/common/admin-as-user.ts:40` (`adminAsUser()`) |
| Exception filter | `src/admin/common/filters/admin-exception.filter.ts` |
| Module registry | `src/admin/admin.module.ts:22-27` (mounted from `src/app.module.ts:68`) |
| Route prefix const | `src/admin/admin.constants.ts:20` (`ADMIN_AUTH_ROUTE_PREFIX = 'api/auth'`) |

---

## A1. Admin Auth — `/api/auth/*`

**Files:**
- Controller: `src/admin/auth/admin-auth.controller.ts` (`@Controller` L69)
- Services: `admin-auth.service.ts`, `admin-token.service.ts`, `admin-two-factor.service.ts`
- Strategy: `admin-jwt.strategy.ts` · Types: `admin-jwt-payload.type.ts`
- DTOs: `src/admin/auth/dto/` — `login.dto.ts`, `verify-2fa-login.dto.ts`, `verify-2fa-setup.dto.ts`
- Module: `admin-auth.module.ts`
- Guards: `AdminJwtAuthGuard, AdminPermissionsGuard` (no class-level permission — logout/2FA-setup work for every role)

| Method | Path | Line | Handler | Auth |
|---|---|---|---|---|
| POST | `/api/auth/login` | L107 | login | Public |
| POST | `/api/auth/2fa/verify-login` | L139 | verify2FALogin | Public |
| POST | `/api/auth/refresh` | L171 | refresh | Public (cookie) |
| POST | `/api/auth/logout` | L188 | logout | Any admin role |
| POST | `/api/auth/2fa/setup` | L201 | setup2FA | Any admin role |
| POST | `/api/auth/2fa/verify-setup` | L209 | verifySetup2FA | Any admin role |

**Login body:** `{ "identifier": "<phone or email>", "password": "<password>" }`

---

## A2. Admin Products — `/admin/products/*` (15 endpoints)

**Files:**
- Controller: `src/admin/products/admin-products.controller.ts` (L73) · Service: `admin-products.service.ts`
- DTOs: `src/admin/products/dto/` — `list-admin-products.query`, `create-admin-product`, `update-admin-product`, `reject-product`, `bulk-product-ids`, `feature-product`, `set-city-price`, `index`
- Constants: `admin-products.constants.ts:13` · Module: `admin-products.module.ts:30-33`
- Guards: `AdminJwtAuthGuard, AdminPermissionsGuard` + `@RequirePermission(Permission.PRODUCTS_MANAGE)`

| Method | Path | Line | Handler |
|---|---|---|---|
| POST | `/admin/products/bulk-approve` | L91 | bulkApprove |
| POST | `/admin/products/bulk-deactivate` | L106 | bulkDeactivate |
| GET | `/admin/products` | L125 | list |
| POST | `/admin/products` | L139 | create |
| GET | `/admin/products/:id` | L154 | getOne |
| PATCH | `/admin/products/:id` | L169 | update |
| DELETE | `/admin/products/:id` | L182 | remove |
| PATCH | `/admin/products/:id/approve` | L197 | approve |
| PATCH | `/admin/products/:id/reject` | L209 | reject |
| PATCH | `/admin/products/:id/feature` | L226 | feature |
| DELETE | `/admin/products/:id/feature` | L236 | unfeature |
| GET | `/admin/products/:id/city-prices` | L247 | listCityPrices |
| PUT | `/admin/products/:id/city-prices` | L260 | setCityPrices |
| GET | `/admin/products/:id/city-prices/:cityId` | L270 | getCityPrice |
| PUT | `/admin/products/:id/city-prices/:cityId` | L282 | setCityPrice |

---

## A3. Admin Users — `/admin/users/*` (5 endpoints)

**Files:**
- Controller: `src/admin/users/admin-users.controller.ts` (L62) · Service: `admin-users.service.ts`
- DTOs: `src/admin/users/dto/` — `list-admin-users.query`, `ban-user`, `wallet-adjustment`, `index`
- Constants: `admin-users.constants.ts:10` · Module: `admin-users.module.ts:30-33` (imports `UsersModule`, `AdminAuditModule`)
- Guards: `AdminJwtAuthGuard, AdminPermissionsGuard` + `@RequirePermission(Permission.USERS_MANAGE)`

| Method | Path | Line | Handler |
|---|---|---|---|
| GET | `/admin/users` | L76 | list |
| GET | `/admin/users/:id` | L92 | getOne |
| PATCH | `/admin/users/:id/ban` | L108 | ban |
| PATCH | `/admin/users/:id/unban` | L123 | unban |
| POST | `/admin/users/:id/wallet-adjustment` | L144 | adjustWallet |

---

## A4. Admin Orders — `/admin/orders/*` (6 endpoints)

**Files:**
- Controller: `src/admin/orders/admin-orders.controller.ts` (L68) · Service: `admin-orders.service.ts`
- DTOs: `src/admin/orders/dto/` — `list-admin-orders.query`, `update-order-status`, `refund-order`, `cancel-admin-order`, `index`
- Constants: `admin-orders.constants.ts:13` · Module: `admin-orders.module.ts:41-44` (imports `OrdersModule`, `UsersModule`, `AdminAuditModule`)
- Guards: `AdminJwtAuthGuard, AdminPermissionsGuard` + `@RequirePermission(Permission.ORDERS_MANAGE)`

| Method | Path | Line | Handler |
|---|---|---|---|
| GET | `/admin/orders` | L84 | list |
| GET | `/admin/orders/:id` | L99 | getOne |
| GET | `/admin/orders/:id/invoice-number` | L112 | invoiceNumber |
| PATCH | `/admin/orders/:id/status` | L131 | updateStatus |
| POST | `/admin/orders/:id/refund` | L153 | refund |
| PATCH | `/admin/orders/:id/cancel` | L173 | cancel |

---

## A5. Legacy Admin Controllers (OLD auth — customer token + `@Roles(admin)`)

> These use `@UseGuards(JwtAuthGuard, RolesGuard)` (`src/common/guards/`) + `@Roles(UserRole.admin)`. **Not** the admin-portal auth. Need a customer-token-with-admin-role, not the portal token.

### A5a. Admin Coupons — `/admin/coupons/*`
Controller: `src/coupons/admin-coupons.controller.ts` (L52) · Service: `admin-coupons.service.ts` · DTOs: `src/coupons/dto/` · Module: `src/coupons/coupons.module.ts:26-27`

| Method | Path | Line | Handler |
|---|---|---|---|
| POST | `/admin/coupons` | L64 | create |
| GET | `/admin/coupons` | L78 | list |
| GET | `/admin/coupons/:id` | L84 | getOne |
| PUT | `/admin/coupons/:id` | L96 | update |
| DELETE | `/admin/coupons/:id` | L111 | softDelete (soft — `is_active=false`) |
| POST | `/admin/coupons/:id/assign` | L123 | assign |

### A5b. Admin Delivery — `/admin/delivery/*` (13 endpoints)
Controller: `src/delivery/admin-delivery.controller.ts` (L65) · Services: `shipments.service.ts`, `courier.service.ts` · DTOs: `src/delivery/dto/`

| Method | Path | Line | Handler |
|---|---|---|---|
| POST | `/admin/delivery/shipments` | L83 | createShipment |
| GET | `/admin/delivery/shipments` | L90 | listShipments |
| GET | `/admin/delivery/shipments/:id` | L98 | getShipment |
| POST | `/admin/delivery/shipments/:id/assign` | L109 | assign |
| PUT | `/admin/delivery/shipments/:id/status` | L124 | updateStatus |
| GET | `/admin/delivery/courier/status` | L142 | courierStatus |
| POST | `/admin/delivery/shipments/:id/dispatch` | L161 | dispatch |
| POST | `/admin/delivery/shipments/reconcile` | L178 | reconcile |
| POST | `/admin/delivery/shipments/:id/manual-handover` | L188 | manualHandover |
| POST | `/admin/delivery/persons` | L208 | createPerson |
| GET | `/admin/delivery/persons` | L217 | listPersons |
| PUT | `/admin/delivery/persons/:id` | L225 | updatePerson |
| PUT | `/admin/delivery/persons/:id/availability` | L234 | setAvailability |

### A5c. Admin Returns — `/admin/returns/*`
Controller: `src/delivery/admin-returns.controller.ts` (L43) · Service: `returns.service.ts`

| Method | Path | Line | Handler |
|---|---|---|---|
| GET | `/admin/returns` | L54 | list |
| GET | `/admin/returns/:id` | L62 | getOne |
| PUT | `/admin/returns/:id/status` | L80 | process |
| POST | `/admin/returns/:id/pickup` | L98 | schedulePickup |

### A5d. Admin Withdrawals — `/admin/withdrawals/*`
Controller: `src/vendors/admin-withdrawals.controller.ts` (L47) · Services: `withdrawals.service.ts`, `vendor-balance.service.ts` · DTOs: `src/vendors/dto/withdrawal.dto.ts` · Module: `src/vendors/vendors.module.ts:41`

| Method | Path | Line | Handler |
|---|---|---|---|
| GET | `/admin/withdrawals` | L61 | list |
| PUT | `/admin/withdrawals/:id/status` | L79 | process |
| POST | `/admin/withdrawals/settle-earnings` | L95 | settleEarnings |
| GET | `/admin/withdrawals/vendors/:vendorId/reconciliation` | L110 | reconcile |

### A5e. Catalog Admin — `/catalog/admin/*`
Controller: `src/catalog/admin.controller.ts` (L45) · Service: `src/catalog/admin.service.ts` · DTOs: `src/catalog/dto/list-admin-products.dto.ts`, `list-admin-categories.dto.ts`

| Method | Path | Line | Handler | Note |
|---|---|---|---|---|
| GET | `/catalog/admin/products` | L59 | listProducts | admin only |
| GET | `/catalog/admin/products/:id` | L78 | getProduct | `@Roles(vendor, admin)` — also a vendor route |
| GET | `/catalog/admin/categories` | L94 | listCategories | admin only |

**Also admin-only** (not in original list): `POST /catalog/categories` (L42) and `PUT /catalog/categories/:id` (L55) in `src/catalog/categories.controller.ts` (L37) — `@Roles(UserRole.admin)`.

---

# PART B — VENDOR SURFACE

> All vendor routes use `JwtAuthGuard + RolesGuard` (`src/common/guards/`) with the **customer token, role=vendor**.

## B1. Vendors — `/vendors/*`
Controller: `src/vendors/vendors.controller.ts` (L52) · Service: `vendors.service.ts` · DTOs: `src/vendors/dto/` (`register-vendor`, `update-vendor-profile`, `list-vendor-orders`, `list-vendor-products`, `update-order-item-status`) · Module: `vendors.module.ts:38-49`
Guards: `JwtAuthGuard, RolesGuard` + `@Roles(UserRole.vendor)`

| Method | Path | Line | Handler |
|---|---|---|---|
| POST | `/vendors/register` | L67 | register |
| GET | `/vendors/profile` | L78 | getProfile |
| PUT | `/vendors/profile` | L90 | updateProfile |
| GET | `/vendors/earnings` | L99 | getEarnings |
| GET | `/vendors/orders` | L105 | listOrders |
| PUT | `/vendors/orders/:orderId/items/:itemId/status` | L121 | updateOrderItemStatus |
| GET | `/vendors/products` | L137 | listProducts |

## B2. Vendor Withdrawals — `/vendors/withdrawals/*`
Controller: `src/vendors/withdrawals.controller.ts` (L40) · Services: `withdrawals.service.ts`, `vendor-balance.service.ts` · DTOs: `src/vendors/dto/withdrawal.dto.ts`
Guards: `JwtAuthGuard, RolesGuard` + `@Roles(UserRole.vendor)`

| Method | Path | Line | Handler |
|---|---|---|---|
| GET | `/vendors/withdrawals/balance` | L51 | balance |
| POST | `/vendors/withdrawals` | L62 | request |
| GET | `/vendors/withdrawals` | L72 | list |

## B3. Catalog Products (vendor write path) — `/catalog/products/*`
Controller: `src/catalog/products.controller.ts` (L52) · Service: `products.service.ts` · DTOs: `src/catalog/dto/` (`create-product`, `update-product`, `add-product-image`, `set-city-prices`, `product-fields`)
Guards: `JwtAuthGuard, RolesGuard` + `@Roles(UserRole.vendor, UserRole.admin)` — shared surface

| Method | Path | Line | Handler |
|---|---|---|---|
| POST | `/catalog/products` | L62 | create |
| PUT | `/catalog/products/:id` | L77 | update |
| DELETE | `/catalog/products/:id` | L90 | remove |
| POST | `/catalog/products/:id/images` | L105 | addImage |
| DELETE | `/catalog/products/:id/images/:imageId` | L119 | removeImage |
| PUT | `/catalog/products/:id/city-prices` | L135 | setCityPrices |

## B4. Vendor Shipments — `/delivery/vendor/shipments`
Controller: `src/delivery/delivery.controller.ts` — `DeliveryController` (L76-78, `JwtAuthGuard, RolesGuard`, per-handler `@Roles`)

| Method | Path | Line | Handler | Role |
|---|---|---|---|---|
| GET | `/delivery/vendor/shipments` | L114 | forVendor | `@Roles(vendor)` |

## B5. Vendor-readable product detail — `/catalog/admin/products/:id`
`src/catalog/admin.controller.ts:78` — `@Roles(vendor, admin)`. Ownership enforced in `productsService.findOneForOwner`; another vendor's product returns 404.

## B6. Resellers — `/resellers/*` (adjacent, any authenticated user — not vendor-role)
Controller: `src/resellers/reseller.controller.ts` (L33) · Service: `reseller.service.ts` · DTOs: `src/resellers/dto/`
Guards: `JwtAuthGuard` only (no `RolesGuard`)

| Method | Path | Line | Handler |
|---|---|---|---|
| POST | `/resellers/register` | L38 | register |
| GET | `/resellers/profile` | L47 | getProfile |
| GET | `/resellers/referrals` | L53 | listReferrals |
| GET | `/resellers/earnings` | L61 | getEarnings |

---

# TOTALS

**Admin:** 32 on the new portal (6 auth + 15 products + 5 users + 6 orders) + 30 legacy (6 coupons + 13 delivery + 4 returns + 4 withdrawals + 3 catalog-admin) + 2 admin-only category writes = **64**.
**Vendor:** 18 (7 vendors + 3 withdrawals + 6 catalog-products + 1 shipments + 1 product detail) + 4 reseller.

---

# NOTES FOR THE FRONTEND / INTEGRATOR

1. **Two admin token flows.** New portal routes (`/api/auth/*`, `/admin/products`, `/admin/users`, `/admin/orders`) need the **admin-portal token** (login at `POST /api/auth/login`, TOTP 2FA, permission RBAC). Legacy admin routes (`/admin/coupons`, `/admin/delivery`, `/admin/returns`, `/admin/withdrawals`, `/catalog/admin`) need a **customer token with role=admin**. Tokens are NOT interchangeable — secrets differ by design.

2. **Response envelope.** New admin modules return `{ success: true, data: { items, page, limit, total, totalPages } }` for lists.

3. **Unused permissions (placeholders for future migration):** `DELIVERY_MANAGE`, `RETURNS_MANAGE`, `WITHDRAWALS_MANAGE`, `SETTINGS_MANAGE`, `PINCODES_MANAGE`, `THEMES_MANAGE`, `ANALYTICS_READ`, `AUDIT_READ`, `ADMIN_MANAGE` — declared in `permissions.ts` but no route uses them yet.

4. **Not yet built (Wave 2 remaining):** Admin Vendors module (`/admin/vendors`) — planned, on the new auth with `VENDORS_MANAGE`.
