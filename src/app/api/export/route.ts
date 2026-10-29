import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TABLES = [
  "accounts",
  "categories",
  "transactions",
  "debts",
  "wishes",
  "budgets",
  "recurring",
] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};
  for (const table of TABLES) {
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", user.id);
    result[table] = data ?? [];
  }
  result._meta = {
    app: "gastos",
    exported_at: new Date().toISOString(),
    email: user.email,
  };

  return NextResponse.json(result, {
    headers: {
      "Content-Disposition": 'attachment; filename="gastos-respaldo.json"',
    },
  });
}
