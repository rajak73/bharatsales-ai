export interface Outlet360Details {
  code: string;
  name: string;
  owner: string;
  category: string;
  tier: string;
  status: string;
  mobile: string;
  email: string;
  language: string;
  address: string;
  state: string;
  pin: string;
  gstin: string;
  creditLimit: string;
  outstanding: string;
  distributor: string;
}

export interface Outlet360Order {
  id: string;
  date: string;
  amount: number;
  items: number;
  status: string;
}

export interface Outlet360Visit {
  date: string;
  rep: string;
  duration: string;
  order: number;
  verified: boolean;
}
