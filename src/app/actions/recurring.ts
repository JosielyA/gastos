"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function createRecurring(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const description = (formData.get("description") as string)?.trim();
  const amount = Number(formData.get("amount") || 0);
  const currency = formData.get("currency") as string;
  const type = formData.get("type") as string;
  const accountId = (formData.get("account_id") as string) || null;
  const categoryId = (formData.get("category_id") as string) || null;
  const frequency = (formData.get("frequency") as string) || "monthly";
  const nextDate =
    (formData.get("next_date") as string) || new Date().toISOString().slice(0, 10);

  if (!description) return { error: "Ingresa una descripción." };
  if (!amount || amount <= 0) return { error: "Ingresa un monto válido." };
  if (!["USD", "VES"].includes(currency))
    return { error: "Selecciona una moneda." };
  if (!["income", "expense"].includes(type))
    return { error: "Selecciona el tipo." };
  if (!["daily", "weekly", "monthly", "yearly"].includes(frequency))
    return { error: "Selecciona la frecuencia." };

  const { error } = await supabase.from("recurring").insert({
    user_id: user.id,
    description,
    amount,
    currency,
    type,
    account_id: accountId,
    category_id: categoryId,
    frequency,
    next_date: nextDate,
    active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}

export async function toggleRecurring(
  id: string,
  active: boolean,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring")
    .update({ active })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}

export async function deleteRecurring(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}
