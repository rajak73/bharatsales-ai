export interface Outlet360Details {
  id: string;
  code: string;
  name: string;
  owner: string;
  category: string;
  tier: string;
  status: string;
  mobile: string;
  address: string;
  state: string;
  pin: string;
  gstin: string;
  creditLimit: number;
  outstanding: number;
  distributorId: string | null;
}

export interface Outlet360Order {
  id: string;
  orderNumber: string;
  date: string;
  amount: number;
  items: number;
  status: string;
}

export interface Outlet360Visit {
  date: string;
  rep: string;
  duration: string;
  verified: boolean;
}
