export interface IncentivePlan {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  slab: string;
  target: string;
  eligible: string;
  payout: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncentivePayout {
  id: string;
  organizationId: string;
  rep: string;
  period: string;
  target: number;
  achieved: number;
  incentive: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
