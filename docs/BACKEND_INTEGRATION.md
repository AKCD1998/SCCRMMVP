# Backend Integration Guide

This document covers everything needed to connect SCCRMMVP to the shared backend
(`currentSC-official-website-project`) for the member card / loyalty features.

**SCCRMMVP never connects directly to PostgreSQL.**
All data flows: `SCCRMMVP` → HTTP → `currentSC-official-website-project` → PostgreSQL.

---

## Current state (as of 2026-05-14)

| Feature | Frontend status | Backend status |
|---|---|---|
| Customer login (email) | ✅ Live | ✅ Live |
| Customer login (LINE / Google) | ✅ Live | ✅ Live |
| Points balance display | ✅ Live | ✅ Live — `GET /api/sccrm/points/:id/balance` |
| Tier display | ✅ Live | ✅ Live — returned in `customer.tier` |
| Transaction history | ✅ Live | ✅ Live — `GET /api/sccrm/points/:id/history` |
| Member card modal (QR + barcode) | ✅ UI built, mock data | ❌ `member_code` column not in DB yet |
| Staff search by member code | ❌ Not built | ❌ Not built |
| Member card from real API | ❌ Uses mock | ❌ Endpoint not updated yet |

---

## Step-by-step integration checklist

### Step 1 — Database migration (run once on the Render PostgreSQL instance)

> **Do not run this automatically. Review the SQL, test on a staging DB first, then apply to production.**

```sql
-- ============================================================
-- Migration: add member_code to customers
-- Run in: currentSC-official-website-project database
-- Render DB dashboard: https://dashboard.render.com/d/dpg-d5c8t695pdvs73c4qffg-a
-- ============================================================

BEGIN;

-- 1. Add the column (nullable first to allow backfill)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS member_code VARCHAR(50);

-- 2. Backfill all existing customers
--    Format: SCM- + first 8 chars of UUID (uppercase, hyphens removed)
UPDATE customers
  SET member_code = 'SCM-' || UPPER(REPLACE(SUBSTRING(id::text, 1, 8), '-', ''))
  WHERE member_code IS NULL;

-- 3. Now make it required
ALTER TABLE customers
  ALTER COLUMN member_code SET NOT NULL;

-- 4. Enforce uniqueness
ALTER TABLE customers
  ADD CONSTRAINT customers_member_code_unique UNIQUE (member_code);

-- 5. Index for fast lookup (staff scanner, search by code)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_member_code
  ON customers (member_code);

COMMIT;
```

**Verify after running:**

```sql
-- Should return 0 rows (no nulls)
SELECT COUNT(*) FROM customers WHERE member_code IS NULL;

-- Should show a sample of generated codes
SELECT id, member_code, phone, full_name FROM customers LIMIT 10;

-- Confirm the index exists
SELECT indexname FROM pg_indexes
  WHERE tablename = 'customers' AND indexname = 'idx_customers_member_code';
```

**Rollback if needed:**

```sql
BEGIN;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_member_code_unique;
DROP INDEX IF EXISTS idx_customers_member_code;
ALTER TABLE customers DROP COLUMN IF EXISTS member_code;
COMMIT;
```

---

### Step 2 — Update registration handler in backend

**File**: `currentSC-official-website-project/backend/routes/sccrm.js`

When a new customer is inserted (both email signup and social signup paths), generate their `member_code` at insert time:

```javascript
// Find the INSERT INTO customers(...) statement in both signup handlers.
// Add member_code to the column list and value:

// Before:
await pool.query(
  `INSERT INTO customers (id, phone, full_name, email, tier)
   VALUES ($1, $2, $3, $4, 'bronze')`,
  [customerId, phone, fullName, email]
);

// After:
const memberCode = 'SCM-' + customerId.replace(/-/g, '').substring(0, 8).toUpperCase();
await pool.query(
  `INSERT INTO customers (id, phone, full_name, email, tier, member_code)
   VALUES ($1, $2, $3, $4, 'bronze', $5)`,
  [customerId, phone, fullName, email, memberCode]
);
```

This must be added to ALL customer creation paths:
- `step: 'complete-email-signup'`
- `step: 'complete-social-signup'`
- `POST /customers` (staff-created customer)

---

### Step 3 — Update GET /customers/:id response

**File**: `currentSC-official-website-project/backend/routes/sccrm.js`

The route that fetches a customer by ID must include `member_code` in the SELECT and in the returned object.

```javascript
// Find the SELECT for customer detail. Add member_code:

// Before:
const result = await pool.query(
  `SELECT id, phone, full_name, email, tier, is_active FROM customers WHERE id = $1`,
  [customerId]
);

// After:
const result = await pool.query(
  `SELECT id, phone, full_name, email, tier, is_active, member_code FROM customers WHERE id = $1`,
  [customerId]
);

// And in the returned object:
// Before:
res.json({ ok: true, customer: { ...result.rows[0], balance, recentTransactions } });

// After (no change needed if using spread — member_code comes through automatically):
res.json({ ok: true, customer: { ...result.rows[0], balance, recentTransactions } });
```

**Verify the response includes `member_code`:**

```bash
curl -H "Authorization: Bearer <token>" \
  https://<backend-url>/api/sccrm/customers/<customer-id>
# Should see: "member_code": "SCM-XXXXXXXX" in the response
```

---

### Step 4 — (Optional) Add staff search by member code

This allows staff to find a customer by scanning the barcode at the counter.

**File**: `currentSC-official-website-project/backend/routes/sccrm.js`

```javascript
// Extend GET /customers/search to also accept member_code query param:

router.get('/customers/search', requireStaff, async (req, res) => {
  const { phone, member_code } = req.query;

  let result;
  if (member_code) {
    result = await pool.query(
      `SELECT c.*, COALESCE(SUM(pl.amount), 0) AS balance
       FROM customers c
       LEFT JOIN point_ledger pl ON pl.customer_id = c.id
       WHERE c.member_code = $1
       GROUP BY c.id`,
      [member_code.toUpperCase()]
    );
  } else if (phone) {
    // existing phone search logic
  }

  if (!result.rows.length) {
    return res.json({ ok: true, customer: null });
  }
  res.json({ ok: true, customer: result.rows[0] });
});
```

---

### Step 5 — Update frontend (one-file change)

**File**: `src/services/memberService.ts`

Replace the mock block with real API calls:

```typescript
import { apiRequest } from '../lib/api';
import type { Customer } from '../types';

export async function fetchMemberCard(
  customerId: string,
  accessToken: string,
): Promise<MemberCardViewModel> {
  // Make both calls in parallel — they are independent
  const [customerRes, balanceRes] = await Promise.all([
    apiRequest<{ ok: true; customer: Customer & { member_code: string } }>(
      `/api/sccrm/customers/${customerId}`,
      { token: accessToken }
    ),
    apiRequest<{ ok: true; balance: number; lifetimeEarned: number }>(
      `/api/sccrm/points/${customerId}/balance`,
      { token: accessToken }
    ),
  ]);

  return toViewModel({
    memberId:       customerRes.customer.id,
    memberCode:     customerRes.customer.member_code,
    fullName:       customerRes.customer.full_name ?? '',
    tier:           customerRes.customer.tier,
    pointsBalance:  balanceRes.balance,
    lifetimeEarned: balanceRes.lifetimeEarned,
  });
}
```

Also update `Customer` type in `src/types.ts` — change the optional to required (or keep optional and add a fallback in the service):

```typescript
// src/types.ts
member_code?: string | null;  // already added — make non-optional once backend ships it
```

---

## API contract reference

All endpoints are on the shared backend. Base URL from env: `EXPO_PUBLIC_API_BASE_URL`.

### Endpoints used by the member card feature

```
GET /api/sccrm/customers/:id
Authorization: Bearer <customerAccessToken>

Response:
{
  "ok": true,
  "customer": {
    "id": "uuid-...",
    "phone": "0812345678",
    "full_name": "John Doe",
    "email": "john@example.com",
    "tier": "silver",                  ← bronze | silver | gold
    "is_active": true,
    "member_code": "SCM-A1B2C3D4",    ← NEW — added by migration
    "balance": 245,
    "recentTransactions": [...]
  }
}
```

```
GET /api/sccrm/points/:customerId/balance
Authorization: Bearer <customerAccessToken>

Response:
{
  "ok": true,
  "customerId": "uuid-...",
  "balance": 245,
  "lifetimeEarned": 1240
}
```

### Tier thresholds (backend-computed, never computed in frontend)

| Tier | Lifetime earned points |
|---|---|
| bronze | 0 – 999 |
| silver | 1,000 – 4,999 |
| gold | 5,000+ |

Tier is stored on `customers.tier` and updated by the backend on every `POST /points/earn` call.

### Points earn formula (backend only — NEVER replicate in frontend)

```
base_points = FLOOR(total_amount_thb / 10)
# Then promotions are applied server-side
# Result returned in earn response: { pointsAwarded, balance, tier }
```

---

## Environment variables required

These must be set in `.env` (local) and in Render environment variables (production):

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | ✅ Yes | Base URL of `currentSC-official-website-project` backend |
| `EXPO_PUBLIC_AUTH_REDIRECT_URI` | ✅ Yes | OAuth deep link redirect (default: `sccrm://oauth`) |
| `EXPO_PUBLIC_LINE_CHANNEL_ID` | For LINE login | LINE OAuth channel ID |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | For Google login | Google OAuth client ID |

**Never commit real values. Use `.env.example` as the template.**

---

## Security notes

- SCCRMMVP never stores or logs raw member codes in analytics or crash reports.
- `member_code` is a public-facing identifier but should not be treated as a secret — it is equivalent to a membership number on a physical card.
- The QR payload (`{ type, version, memberCode }`) is not encrypted. If short-lived rotating tokens are required (for high-security scenarios), see ADR-005 in `DECISIONS.md` for the planned upgrade path.
- `customers.id` (UUID) is the internal identifier. It is never exposed in QR codes, barcodes, or displayed to members or staff.

---

## Render deployment context

- **Backend service**: `currentSC-official-website-project` — deployed on Render Web Service
- **Database**: Render PostgreSQL instance
- **Dashboard references**: stored as project context only — do not hardcode these URLs in frontend code
- **Migration tool**: Knex (`npm run migrate` in `currentSC-official-website-project/backend/`)
  - Alternatively: run the raw SQL above directly in the Render DB console
  - Migration file location: `backend/migrations/` — add a new `.cjs` file following the existing naming convention (`YYYYMMDDNNNN_description.cjs`)

---

## Future features to design for

These are not implemented yet but the current schema and service layer are designed to accommodate them:

| Feature | Backend work needed | Frontend work needed |
|---|---|---|
| Rotating QR tokens (short-lived) | `POST /api/sccrm/members/me/qr-token` endpoint | `memberService.fetchMemberCard()` calls the new endpoint; modal gets `expiresAt` prop |
| Coupons | `coupons` table + `GET /api/sccrm/members/me/coupons` | `memberService.fetchCoupons()`; new tab in member modal |
| Package / course balances | `member_packages` table | `memberService.fetchPackages()` |
| Visit history | Query `point_ledger` filtered by type | `memberService.fetchVisitHistory()` |
| Branch-specific promotions | `promotions` table already exists | `memberService.fetchActivePromotions()` |
| Staff scan by barcode | `GET /api/sccrm/customers/search?member_code=...` | New barcode scan input in `StaffHomeScreen` |
