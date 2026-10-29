"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const type = formData.get("type") as string;
  const icon = (formData.get("icon") as string) || "tag";
  const color = (formData.get("color") as string) || "#888888";

  if (!name) return { error: "Ingresa un nombre." };
  if (!["income", "expense"].includes(type))
    return { error: "Selecciona el tipo." };

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    type,
    icon,
    color,
  });
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}
