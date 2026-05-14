/**
 * memberService — thin adapter between SCCRMMVP UI and the shared backend.
 *
 * Architecture contract:
 *   PostgreSQL  ←→  currentSC-official-website-project (API/business logic)
 *                              ↕  HTTP
 *                         SCCRMMVP  (this file — UI client only)
 *
 * This file is the single place to swap mock data for real API calls.
 * No business logic lives here — it only shapes the response into a ViewModel.
 */

import type { MemberCardData, MemberCardViewModel, MemberQRPayload } from '../types/memberTypes';
import { mockMemberCardData } from '../mocks/mockMemberData';

// ─── QR payload builder ────────────────────────────────────────────────────────
// Kept here (not in the component) so the payload format is versioned in one place.

function buildQRPayload(memberCode: string): string {
  const payload: MemberQRPayload = {
    type: 'member_card',
    version: 1,
    memberCode,
    // Future: issuedAt: Date.now(),
    // Future: expiresAt: Date.now() + 5 * 60 * 1000,
    // Future: sessionToken fetched from /api/sccrm/members/me/qr-token
  };
  return JSON.stringify(payload);
}

// ─── Tier label ────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze Member',
  silver: 'Silver Member',
  gold: 'Gold Member',
};

// ─── ViewModel builder ─────────────────────────────────────────────────────────
// Transforms raw MemberCardData (API shape) → MemberCardViewModel (UI shape).
// All presentation decisions live here, not in components.

function toViewModel(data: MemberCardData): MemberCardViewModel {
  return {
    memberCode: data.memberCode,
    displayName: data.fullName,
    tier: data.tier,
    tierLabel: TIER_LABELS[data.tier] ?? data.tier,
    pointsBalance: data.pointsBalance,
    lifetimeEarned: data.lifetimeEarned,
    qrPayload: buildQRPayload(data.memberCode),
    barcodePayload: data.memberCode,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch the member card data for the currently logged-in customer.
 *
 * TODO — backend integration (when member_code migration is live):
 *   1. Run migration: ALTER TABLE customers ADD COLUMN member_code VARCHAR(50) UNIQUE
 *   2. Backfill:      UPDATE customers SET member_code = 'SCM-' || UPPER(SUBSTRING(id::text,1,8))
 *   3. Update backend route GET /api/sccrm/customers/:id to include member_code in response
 *   4. Update Customer type in src/types.ts: member_code?: string
 *   5. Replace the mock block below with:
 *
 *   import { apiRequest } from '../lib/api';
 *   import type { Customer } from '../types';
 *
 *   const [customerRes, balanceRes] = await Promise.all([
 *     apiRequest<{ ok: true; customer: Customer & { member_code: string } }>(
 *       `/api/sccrm/customers/${customerId}`,
 *       { token: accessToken }
 *     ),
 *     apiRequest<{ ok: true; balance: number; lifetimeEarned: number }>(
 *       `/api/sccrm/points/${customerId}/balance`,
 *       { token: accessToken }
 *     ),
 *   ]);
 *   return toViewModel({
 *     memberId: customerRes.customer.id,
 *     memberCode: customerRes.customer.member_code,
 *     fullName: customerRes.customer.full_name ?? '',
 *     tier: customerRes.customer.tier,
 *     pointsBalance: balanceRes.balance,
 *     lifetimeEarned: balanceRes.lifetimeEarned,
 *   });
 */
export async function fetchMemberCard(
  _customerId: string,
  _accessToken: string,
): Promise<MemberCardViewModel> {
  // ── MOCK (remove this block when backend is ready) ──────────────────────────
  return toViewModel(mockMemberCardData);
  // ───────────────────────────────────────────────────────────────────────────
}
