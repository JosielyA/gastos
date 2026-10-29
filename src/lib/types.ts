export type Currency = "USD" | "VES";
export type TxType = "income" | "expense";
export type Role = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "bank" | "wallet";
  currency: Currency;
  initial_balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TxType;
  icon: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TxType;
  amount: number;
  currency: Currency;
  account_id: string | null;
  category_id: string | null;
  date: string;
  note: string | null;
  rate_bcv: number | null;
  rate_parallel: number | null;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: Currency;
  due_date: string | null;
  status: "pending" | "partial" | "paid";
  amount_paid: number;
  note: string | null;
  created_at: string;
}

export interface Wish {
  id: string;
  user_id: string;
  name: string;
  price: number | null;
  currency: Currency | null;
  priority: "low" | "medium" | "high";
  goal: number | null;
  link: string | null;
  status: "wishlist" | "saving" | "bought";
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  month: string;
  limit_amount: number;
  currency: Currency;
  created_at: string;
}

export interface Recurring {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: Currency;
  type: TxType;
  account_id: string | null;
  category_id: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  next_date: string;
  active: boolean;
  created_at: string;
}

export interface Rates {
  bcv: number;
  parallel: number;
  updated_at: string | null;
}
