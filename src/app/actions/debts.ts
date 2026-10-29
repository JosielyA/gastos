"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function createDebt(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const description = (formData.get("description") as string)?.trim();
  const amount = Number(formData.get("amount") || 0);
  const currency = formData.get("currency") as string;
  const dueDate = (formData.get("due_date") as string) || null;
  const note = (formData.get("note") as string) || null;

  if (!description) return { error: "Ingresa una descripción." };
  if (!amount || amount <= 0) return { error: "Ingresa un monto válido." };
  if (!["USD", "VES"].includes(currency))
    return { error: "Selecciona una moneda." };

  const { error } = await supabase.from("debts").insert({
    user_id: user.id,
    description,
    amount,
    currency,
    due_date: dueDate,
    note,
    status: "pending",
    amount_paid: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/deudas");
  return { success: true };
}

export async function updateDebt(
  id: string,
  fields: {
    description?: string;
    amount?: number;
    currency?: "USD" | "VES";
    due_date?: string | null;
    note?: string | null;
    status?: "pending" | "partial" | "paid";
    amount_paid?: number;
  },
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/deudas");
  return { success: true };
}

export async function deleteDebt(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/deudas");
  return { success: true };
}
