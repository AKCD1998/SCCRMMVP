import type { CustomerTier } from '../types';

// ─── QR Payload ───────────────────────────────────────────────────────────────
// Structured JSON encoded inside every QR code.
// version field lets the staff scanner app evolve the payload without breaking
// existing printed/cached cards.

export interface MemberQRPayload {
  type: 'member_card';
  version: number;
  memberCode: string;
  // Future fields (add without bumping version if additive; bump version if breaking):
  // issuedAt?: number;      // Unix ms — for rotating short-lived tokens
  // expiresAt?: number;     // Unix ms — for expiring QR sessions
  // sessionToken?: string;  // one-time staff-scan token from backend
  // branchId?: string;      // for branch-specific promotions
}

// ─── Raw data shape from the backend ─────────────────────────────────────────
// Mirrors what GET /api/sccrm/customers/:id will return once the backend
// migration (ALTER TABLE customers ADD COLUMN member_code VARCHAR(50)) is done.
// Fields match the backend's snake_case response contract.

export interface MemberCardData {
  memberId: string;        // internal UUID — never shown to the member
  memberCode: string;      // public identifier — shown on card, encoded in QR/barcode
  fullName: string;
  tier: CustomerTier;
  pointsBalance: number;
  lifetimeEarned: number;
  // Future expansions (backend must supply these):
  // couponsCount?: number;
  // packageBalances?: PackageBalance[];
  // activePromotions?: string[];
  // visitCount?: number;
  // lastVisitAt?: string;
}

// ─── Presentation ViewModel ───────────────────────────────────────────────────
// What the UI layer receives — ready to render, no raw API types leaking into
// screens or components.

export interface MemberCardViewModel {
  memberCode: string;
  displayName: string;
  tier: CustomerTier;
  tierLabel: string;         // e.g. "Silver Member"
  pointsBalance: number;
  lifetimeEarned: number;

  // Scannable payloads
  qrPayload: string;         // JSON string of MemberQRPayload
  barcodePayload: string;    // plain memberCode string — CODE128 encodes this

  // Future display metadata
  // expiresAt?: Date;         // show countdown / refresh prompt when near expiry
  // isOfflineCached?: boolean; // show stale-data badge when offline
  // isRefreshing?: boolean;    // show loading state on QR without closing modal
}
