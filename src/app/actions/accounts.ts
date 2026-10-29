"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function createAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;
  const currency = formData.get("currency") as string;
  const initialBalance = Number(formData.get("initial_balance") || 0);

  if (!name) return { error: "Ingresa un nombre." };
  if (!["bank", "wallet"].includes(type))
    return { error: "Selecciona el tipo." };
  if (!["USD", "VES"].includes(currency))
    return { error: "Selecciona la moneda." };

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    currency,
    initial_balance: Number.isFinite(initialBalance) ? initialBalance : 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/cuentas");
  return { success: true };
}

export async function quickCreateAccount(
  name: string,
  type: "bank" | "wallet",
  currency: "USD" | "VES",
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name,
    type,
    currency,
    initial_balance: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/cuentas");
  return { success: true };
}

export async function deleteAccount(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/cuentas");
  return { success: true };
}
