"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function inviteUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireProfile();
  if (profile.role !== "admin") return { error: "No tienes permisos de administrador." };
  if (!hasServiceRole())
    return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Ingresa un correo válido." };

  const admin = createAdminClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) return { error: error.message };
  revalidatePath("/ajustes");
  return { success: true };
}
