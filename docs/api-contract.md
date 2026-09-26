# API contract and authorization boundary

All endpoints require a verified vendor session (`Authorization: Bearer <access token>`) except `/v1/auth/*` and application onboarding. The backend derives `vendorId` exclusively from the session—**never** from request body or path input—and every repository query includes that ID.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/otp`, `POST /auth/verify`, `POST /auth/google`, `POST /auth/truecaller`, `DELETE /sessions/:id`, `DELETE /sessions` |
| Onboarding & store | `GET/PUT /vendor`, `POST /kyc`, `GET/PUT /store`, `GET /sessions` |
| Catalog | `GET/POST /products`, `GET/PATCH/DELETE /products/:id`, `POST /products/bulk/validate`, `POST /products/bulk/import`, `GET/PUT /products/:id/city-prices`, `PATCH /inventory/:productId` |
| Fulfilment | `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `GET /orders/:id/invoice`, `GET/PATCH /shipments/:orderId`, `GET/PATCH /returns/:id` |
| Finance | `GET /earnings`, `GET /settlements`, `POST /withdrawals`, `GET /withdrawals`, `GET /reports/earnings.csv` |
| Engagement | `GET /reviews`, `PUT /reviews/:id/response`, `GET/PATCH /notifications`, `GET/POST /support/tickets`, `GET/POST /support/tickets/:id/messages` |

Use schema validation at the route boundary (Zod/Valibot), transactionally update order and shipment state, store only document URLs/identity suffixes in application tables, encrypt payout details with a KMS-backed envelope key, and return problem+json errors. Rate-limit OTP and upload endpoints; restrict uploads by MIME, size, signed ownership and virus scan before persisting a URL.
