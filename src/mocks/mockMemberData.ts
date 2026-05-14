import type { MemberCardData } from '../types/memberTypes';

// ─── Mock member code ─────────────────────────────────────────────────────────
// Format mirrors the proposed backend format: SCM-{8 uppercase hex chars}
// When the backend migration is live (ALTER TABLE customers ADD COLUMN member_code),
// this will be replaced by the value returned in customer.member_code from
// GET /api/sccrm/customers/:id (backend: currentSC-official-website-project)

export const MOCK_MEMBER_CODE = 'SCM-A1B2C3D4';

// ─── Mock member card ─────────────────────────────────────────────────────────
// Matches the shape of MemberCardData exactly so the service layer can swap
// this out for a real API response with zero UI changes.

export const mockMemberCardData: MemberCardData = {
  memberId: '00000000-0000-0000-0000-000000000000', // placeholder UUID
  memberCode: MOCK_MEMBER_CODE,
  fullName: 'Demo Member',
  tier: 'silver',
  pointsBalance: 245,
  lifetimeEarned: 1240,
};
