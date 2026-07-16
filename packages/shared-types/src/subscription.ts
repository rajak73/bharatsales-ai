export interface SubscriptionUsage {
  used: number;
  limit: number;
}

export interface SubscriptionStorage {
  used: string;
  limit: string;
}

export interface SubscriptionPlan {
  name: string;
  price: string;
  users: number | string;
  distributors: number | string;
  storage: string;
  features: string[];
  current?: boolean;
}

export interface SubscriptionInvoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  plan: string;
}

export interface SubscriptionData {
  currentPlan: {
    name: string;
    price: string;
    status: string;
    startDate: string;
    nextBilling: string;
    users: SubscriptionUsage;
    distributors: SubscriptionUsage;
    storage: SubscriptionStorage;
  };
  plans: SubscriptionPlan[];
  invoices: SubscriptionInvoice[];
}
