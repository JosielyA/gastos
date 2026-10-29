"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function upsertBudget(
  categoryId: string | null,
  month: string,
  limitAmount: number,
  currency: "USD" | "VES",
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  if (!month) return { error: "Selecciona un mes." };
  if (!limitAmount || limitAmount <= 0)
    return { error: "Ingresa un límite válido." };

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      month,
      limit_amount: limitAmount,
      currency,
    },
    { onConflict: "user_id,category_id,month" },
  );
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}

export async function deleteBudget(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}
