import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  PiggyBank,
  Target,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import {
  getAccounts,
  getCategories,
  getDebts,
  getTransactions,
  getWishes,
} from "@/lib/data";
import { getRates } from "@/lib/rates";
import { currentMonth, formatDate, formatMoney } from "@/lib/format";
import { RatesCard } from "@/components/rates-card";
import { SpendingChart } from "@/components/spending-chart";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [accounts, categories, transactions, debts, wishes, rates] =
    await Promise.all([
      getAccounts(),
      getCategories(),
      getTransactions(),
      getDebts(),
      getWishes(),
      getRates(),
    ]);

  // Saldo por cuenta
  const balances = new Map<string, number>();
  for (const a of accounts) balances.set(a.id, a.initial_balance);
  for (const t of transactions) {
    if (!t.account_id) continue;
    const delta = t.type === "income" ? t.amount : -t.amount;
    balances.set(t.account_id, (balances.get(t.account_id) ?? 0) + delta);
  }

  const patrimonyUSD = accounts
    .filter((a) => a.currency === "USD")
    .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
  const patrimonyVES = accounts
    .filter((a) => a.currency === "VES")
    .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);

  // Resumen del mes
  const month = currentMonth();
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const sum = (arr: typeof monthTx, type: string, cur: string) =>
    arr
      .filter((t) => t.type === type && t.currency === cur)
      .reduce((s, t) => s + t.amount, 0);

  const incomeUSD = sum(monthTx, "income", "USD");
  const incomeVES = sum(monthTx, "income", "VES");
  const expenseUSD = sum(monthTx, "expense", "USD");
  const expenseVES = sum(monthTx, "expense", "VES");

  // Deudas próximas (no pagadas, ordenadas por fecha)
  const openDebts = debts
    .filter((d) => d.status !== "paid")
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    })
    .slice(0, 4);

  const savingWishes = wishes.filter((w) => w.status === "saving").slice(0, 3);

  const name = profile.full_name?.trim() || profile.email?.split("@")[0] || "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Hola{name ? `, ${name}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Este es el resumen de tu dinero.
        </p>
      </div>

      {/* Patrimonio */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary p-4 text-primary-foreground">
          <div className="text-xs opacity-80">Total en USD</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {formatMoney(patrimonyUSD, "USD")}
          </div>
          <div className="mt-1 text-xs opacity-70">
            {accounts.filter((a) => a.currency === "USD").length} cuenta(s)
          </div>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="text-xs text-muted-foreground">Total en Bs</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {formatMoney(patrimonyVES, "VES")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {accounts.filter((a) => a.currency === "VES").length} cuenta(s)
          </div>
        </div>
      </div>

      <RatesCard rates={rates} />

      {/* Resumen del mes */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Resumen del mes</h3>
          <Link
            href="/movimientos"
            className="text-xs text-primary hover:underline"
          >
            Ver todo
          </Link>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight className="size-4" />
              </span>
              <span className="text-sm">Ingresos</span>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium tabular-nums">
                {formatMoney(incomeUSD, "USD")}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(incomeVES, "VES")}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="size-4" />
              </span>
              <span className="text-sm">Egresos</span>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium tabular-nums">
                {formatMoney(expenseUSD, "USD")}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(expenseVES, "VES")}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm font-medium">Balance</span>
            <div className="text-right text-sm">
              <div className="font-semibold tabular-nums">
                {formatMoney(incomeUSD - expenseUSD, "USD")}
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(incomeVES - expenseVES, "VES")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de gastos por categoría */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <SpendingChart transactions={monthTx} categories={categories} />
      </div>

      {/* Cuentas */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Mis cuentas</h3>
          <Link
            href="/cuentas"
            className="text-xs text-primary hover:underline"
          >
            Gestionar
          </Link>
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no tienes cuentas.{" "}
            <Link href="/cuentas" className="text-primary hover:underline">
              Agrega tu primera cuenta
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-1">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm">{a.name}</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatMoney(balances.get(a.id) ?? 0, a.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deudas próximas */}
      {openDebts.length > 0 && (
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <CalendarClock className="size-4 text-muted-foreground" />
              Deudas pendientes
            </h3>
            <Link href="/deudas" className="text-xs text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          <div className="space-y-1">
            {openDebts.map((d) => {
              const overdue =
                d.due_date && d.due_date < new Date().toISOString().slice(0, 10);
              const remaining = Math.max(0, d.amount - d.amount_paid);
              return (
                <Link
                  key={d.id}
                  href="/deudas"
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{d.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.due_date
                        ? `${overdue ? "Venció" : "Vence"}: ${formatDate(d.due_date)}`
                        : "Sin fecha de pago"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && (
                      <Badge variant="destructive" className="text-[10px]">
                        Vencida
                      </Badge>
                    )}
                    <span className="text-sm font-medium tabular-nums">
                      {formatMoney(remaining, d.currency)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Metas de ahorro */}
      {savingWishes.length > 0 && (
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-medium">
              <Target className="size-4 text-muted-foreground" />
              Metas de ahorro
            </h3>
            <Link href="/deseos" className="text-xs text-primary hover:underline">
              Ver deseos
            </Link>
          </div>

          <div className="space-y-3">
            {savingWishes.map((w) => {
              const price = w.price ?? 0;
              const goal = w.goal ?? 0;
              const pct = price > 0 ? Math.min(100, Math.round((goal / price) * 100)) : 0;
              return (
                <div key={w.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{w.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {w.currency
                        ? `${formatMoney(goal, w.currency)} / ${formatMoney(price, w.currency)}`
                        : "Sin precio"}
                    </span>
                  </div>
                  {price > 0 && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sugerencia rápida si no hay datos */}
      {accounts.length === 0 && transactions.length === 0 && (
        <div className="rounded-xl border border-dashed p-4 text-center">
          <PiggyBank className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Empieza agregando tus cuentas y registrando tus primeros movimientos.
          </p>
          <Link
            href="/cuentas"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            Ir a cuentas <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
