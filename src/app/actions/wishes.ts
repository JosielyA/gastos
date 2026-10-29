"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function createWish(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const priceRaw = formData.get("price") as string;
  const currency = (formData.get("currency") as string) || null;
  const priority = (formData.get("priority") as string) || "medium";
  const goalRaw = formData.get("goal") as string;
  const link = (formData.get("link") as string) || null;

  if (!name) return { error: "Ingresa un nombre." };
  if (!["low", "medium", "high"].includes(priority))
    return { error: "Selecciona una prioridad." };

  const price = priceRaw ? Number(priceRaw) : null;
  const goal = goalRaw ? Number(goalRaw) : null;

  const { error } = await supabase.from("wishes").insert({
    user_id: user.id,
    name,
    price: price && price > 0 ? price : null,
    currency: price ? currency || "USD" : null,
    priority,
    goal: goal && goal > 0 ? goal : null,
    link: link || null,
    status: "wishlist",
  });
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/deseos");
  return { success: true };
}

export async function updateWish(
  id: string,
  fields: {
    status?: "wishlist" | "saving" | "bought";
    goal?: number | null;
  },
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("wishes")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/deseos");
  return { success: true };
}

export async function deleteWish(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("wishes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/deseos");
  return { success: true };
}
