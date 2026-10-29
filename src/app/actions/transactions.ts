"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRates } from "@/lib/rates";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

function invalid(msg: string): ActionState {
  return { error: msg };
}

export async function createTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const type = formData.get("type") as string;
  const amount = Number(formData.get("amount"));
  const currency = formData.get("currency") as string;
  const accountId = (formData.get("account_id") as string) || null;
  const categoryId = (formData.get("category_id") as string) || null;
  const date =
    (formData.get("date") as string) || new Date().toISOString().slice(0, 10);
  const note = (formData.get("note") as string) || null;

  if (!["income", "expense"].includes(type))
    return invalid("Selecciona si es ingreso o egreso.");
  if (!amount || amount <= 0) return invalid("Ingresa un monto válido.");
  if (!["USD", "VES"].includes(currency))
    return invalid("Selecciona una moneda.");

  const rates = await getRates();

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type,
    amount,
    currency,
    account_id: accountId,
    category_id: categoryId,
    date,
    note,
    rate_bcv: rates.bcv || null,
    rate_parallel: rates.parallel || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/movimientos");
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/movimientos");
  return { success: true };
}
