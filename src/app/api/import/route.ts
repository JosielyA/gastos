import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

function clean(row: Row): Row {
  const { id, user_id, created_at, ...rest } = row;
  void id;
  void user_id;
  void created_at;
  return rest;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<
    string,
    Row[]
  > | null;
  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const counts: Record<string, number> = {};

  try {
    // 1. Cuentas (con remapeo de IDs)
    const accountMap = new Map<string, string>();
    const accounts = (body.accounts ?? []) as Row[];
    for (const a of accounts) {
      const newId = crypto.randomUUID();
      accountMap.set(a.id as string, newId);
      await supabase.from("accounts").insert({
        id: newId,
        user_id: user.id,
        ...clean(a),
      });
    }
    counts.accounts = accounts.length;

    // 2. Categorías
    const categoryMap = new Map<string, string>();
    const categories = (body.categories ?? []) as Row[];
    for (const c of categories) {
      const newId = crypto.randomUUID();
      categoryMap.set(c.id as string, newId);
      await supabase.from("categories").insert({
        id: newId,
        user_id: user.id,
        ...clean(c),
      });
    }
    counts.categories = categories.length;

    // 3. Movimientos (con remapeo de cuentas/categorías)
    const transactions = (body.transactions ?? []) as Row[];
    for (const t of transactions) {
      const data = clean(t) as Row;
      if (t.account_id && accountMap.has(t.account_id as string)) {
        data.account_id = accountMap.get(t.account_id as string);
      } else {
        data.account_id = null;
      }
      if (t.category_id && categoryMap.has(t.category_id as string)) {
        data.category_id = categoryMap.get(t.category_id as string);
      } else {
        data.category_id = null;
      }
      await supabase.from("transactions").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        ...data,
      });
    }
    counts.transactions = transactions.length;

    // 4. Deudas
    const debts = (body.debts ?? []) as Row[];
    for (const d of debts) {
      await supabase.from("debts").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        ...clean(d),
      });
    }
    counts.debts = debts.length;

    // 5. Deseos
    const wishes = (body.wishes ?? []) as Row[];
    for (const w of wishes) {
      await supabase.from("wishes").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        ...clean(w),
      });
    }
    counts.wishes = wishes.length;

    // 6. Presupuestos
    const budgets = (body.budgets ?? []) as Row[];
    for (const b of budgets) {
      const data = clean(b) as Row;
      if (b.category_id && categoryMap.has(b.category_id as string)) {
        data.category_id = categoryMap.get(b.category_id as string);
      } else {
        data.category_id = null;
      }
      await supabase.from("budgets").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        ...data,
      });
    }
    counts.budgets = budgets.length;

    // 7. Recurrentes
    const recurring = (body.recurring ?? []) as Row[];
    for (const r of recurring) {
      const data = clean(r) as Row;
      if (r.account_id && accountMap.has(r.account_id as string)) {
        data.account_id = accountMap.get(r.account_id as string);
      } else {
        data.account_id = null;
      }
      if (r.category_id && categoryMap.has(r.category_id as string)) {
        data.category_id = categoryMap.get(r.category_id as string);
      } else {
        data.category_id = null;
      }
      await supabase.from("recurring").insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        ...data,
      });
    }
    counts.recurring = recurring.length;

    return NextResponse.json({ success: true, counts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al importar" },
      { status: 500 },
    );
  }
}
