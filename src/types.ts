export type CustomerTier = 'bronze' | 'silver' | 'gold';

export type Customer = {
  id: string;
  phone: string;
  full_name?: string | null;
  email?: string | null;
  tier: CustomerTier;
  is_active?: boolean;
  balance?: number;
  recentTransactions?: Transaction[];
  // Added once backend migration runs:
  // ALTER TABLE customers ADD COLUMN member_code VARCHAR(50) UNIQUE;
  // See: src/services/memberService.ts for the full integration TODO.
  member_code?: string | null;
};

export type Transaction = {
  id: string;
  total_amount: number;
  point_earned: number;
  source: 'pos_import' | 'manual' | 'online';
  pos_ref_id?: string | null;
  created_at: string;
};

export type PointHistoryItem = {
  id: string;
  amount: number;
  type: 'purchase' | 'redeem' | 'adjustment' | 'expire' | 'promotion';
  reference_id?: string | null;
  note?: string | null;
  created_by: string;
  created_at: string;
};

export type Promotion = {
  id: string;
  name: string;
  type: 'multiplier' | 'fixed_bonus' | 'threshold';
  value: number;
  condition_json: Record<string, unknown>;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type SessionResponse = {
  ok: true;
  customer: Customer;
  accessToken: string;
  refreshToken: string;
};
