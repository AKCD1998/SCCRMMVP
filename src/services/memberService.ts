/**
 * memberService — thin adapter between SCCRMMVP UI and the shared backend.
 *
 * Architecture contract:
 *   PostgreSQL  ←→  currentSC-official-website-project (API/business logic)
 *                              ↕  HTTP
 *                         SCCRMMVP  (this file — UI client only)
 *
 * Identity:  users.id         = customerId in JWT and all API calls
 * Loyalty:   member_profiles  = tier, member_code, is_active
 * History:   point_ledger     = all point transactions
 *
 * This file is the single place that bridges the API response to the ViewModel
 * consumed by MemberCodeModal. No business logic lives here.
 */

import { apiRequest } from '../lib/api';
import type { Customer } from '../types';
import type { EarnResult, MemberCardData, MemberCardViewModel, MemberQRPayload } from '../types/memberTypes';

// ─── QR payload builder ────────────────────────────────────────────────────────
// Versioned so the scanner app can evolve the payload format without breaking
// existing scans. Version 1 = stable member_code only.

function buildQRPayload(memberCode: string): string {
  const payload: MemberQRPayload = {
    type: 'member_card',
    version: 1,
    memberCode,
    // Future version 2: add sessionToken + issuedAt + expiresAt for rotating QR
  };
  return JSON.stringify(payload);
}

// ─── Tier label ────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze Member',
  silver: 'Silver Member',
  gold:   'Gold Member',
};

// ─── ViewModel builder ─────────────────────────────────────────────────────────

function toViewModel(data: MemberCardData): MemberCardViewModel {
  return {
    memberCode:     data.memberCode,
    displayName:    data.fullName,
    tier:           data.tier,
    tierLabel:      TIER_LABELS[data.tier] ?? data.tier,
    pointsBalance:  data.pointsBalance,
    lifetimeEarned: data.lifetimeEarned,
    qrPayload:      buildQRPayload(data.memberCode),
    barcodePayload: data.memberCode,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch a 15-minute HMAC-signed scan token to embed in the member card barcode.
 * The token is opaque to the mobile app — only the backend can verify it.
 * POS strips the "SCM-POINT-v1-" prefix and calls /resolve-scan-token.
 */
export async function fetchScanToken(
  accessToken: string,
): Promise<{ token: string; expiresAt: Date }> {
  const res = await apiRequest<{ ok: true; token: string; expiresAt: string }>(
    '/api/sccrm/customers/me/scan-token',
    { token: accessToken },
  );
  return { token: res.token, expiresAt: new Date(res.expiresAt) };
}

/**
 * Poll for a recent earn transaction on the given customer.
 * Returns EarnResult if a purchase earn occurred after `since`, null otherwise.
 * Mobile app calls this every 3 s while the QR screen is open.
 */
export async function pollRecentEarn(
  customerId: string,
  accessToken: string,
  since: Date,
  customerName: string,
): Promise<EarnResult | null> {
  const res = await apiRequest<{
    ok: true;
    found: boolean;
    earnedPoints?: number;
    totalAmount?: number;
    receiptNumber?: string | null;
    branchName?: string | null;
    createdAt?: string;
    balance?: number;
  }>(
    `/api/sccrm/points/${customerId}/recent-earn?since=${since.toISOString()}`,
    { token: accessToken },
  );
  if (!res.found) return null;
  return {
    earnedPoints:  res.earnedPoints!,
    totalAmount:   res.totalAmount  ?? null,
    receiptNumber: res.receiptNumber ?? null,
    branchName:    res.branchName    ?? null,
    newBalance:    res.balance!,
    customerName,
    createdAt:     res.createdAt!,
  };
}

/**
 * Fetch the member card ViewModel for the logged-in customer.
 *
 * Makes two parallel requests:
 *   GET /api/sccrm/customers/:id  → customer identity + member_code + tier
 *   GET /api/sccrm/points/:id/balance → points balance + lifetime earned
 *
 * Both endpoints require the customer's JWT access token.
 * The result is cached in CustomerPointsScreen local state for the session.
 */
export async function fetchMemberCard(
  customerId: string,
  accessToken: string,
): Promise<MemberCardViewModel> {
  const [customerRes, balanceRes] = await Promise.all([
    apiRequest<{ ok: true; customer: Customer & { member_code: string } }>(
      `/api/sccrm/customers/${customerId}`,
      { token: accessToken },
    ),
    apiRequest<{ ok: true; customerId: string; balance: number; lifetimeEarned: number }>(
      `/api/sccrm/points/${customerId}/balance`,
      { token: accessToken },
    ),
  ]);

  const memberCode = customerRes.customer.member_code ?? `SCM-${customerId.replace(/-/g, '').substring(0, 8).toUpperCase()}`;

  return toViewModel({
    memberId:       customerRes.customer.id,
    memberCode,
    fullName:       customerRes.customer.full_name ?? '',
    tier:           customerRes.customer.tier,
    pointsBalance:  balanceRes.balance,
    lifetimeEarned: balanceRes.lifetimeEarned,
  });
}
