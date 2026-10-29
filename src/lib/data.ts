import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Account,
  Budget,
  Category,
  Debt,
  Recurring,
  Transaction,
  Wish,
} from "@/lib/types";

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as Account[];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as Category[];
}

export async function getTransactions(opts?: {
  type?: "income" | "expense";
  month?: string; // YYYY-MM
  from?: string;
  to?: string;
  limit?: number;
}): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.type) query = query.eq("type", opts.type);
  if (opts?.month) {
    query = query
      .gte("date", `${opts.month}-01`)
      .lte("date", `${opts.month}-31`);
  }
  if (opts?.from) query = query.gte("date", opts.from);
  if (opts?.to) query = query.lte("date", opts.to);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data } = await query;
  return (data ?? []) as Transaction[];
}

export async function getDebts(): Promise<Debt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Debt[];
}

export async function getWishes(): Promise<Wish[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Wish[];
}

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Budget[];
}

export async function getRecurring(): Promise<Recurring[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recurring")
    .select("*")
    .order("next_date", { ascending: true });
  return (data ?? []) as Recurring[];
}

export async function getAllProfiles() {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return (data ?? []) as {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "user";
    created_at: string;
  }[];
}
