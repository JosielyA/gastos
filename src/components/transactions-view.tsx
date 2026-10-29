"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { deleteTransaction } from "@/app/actions/transactions";
import type { Account, Category, Transaction } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";

type Filter = "all" | "income" | "expense";

export function TransactionsView({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = transactions.filter(
    (t) => filter === "all" || t.type === filter,
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar este movimiento?")) return;
    const res = await deleteTransaction(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Movimiento eliminado");
      router.refresh();
    }
  }

  const filterBtn = (value: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        filter === value
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {filterBtn("all", "Todos")}
        {filterBtn("income", "Ingresos")}
        {filterBtn("expense", "Egresos")}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay movimientos todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDate(date)}
              </div>
              <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {items.map((t, i) => {
                  const account = t.account_id
                    ? accountMap.get(t.account_id)
                    : null;
                  const category = t.category_id
                    ? categoryMap.get(t.category_id)
                    : null;
                  const isIncome = t.type === "income";
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5",
                        i > 0 && "border-t border-border/60",
                      )}
                    >
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: category
                            ? `${category.color}26`
                            : "var(--muted)",
                          color: category?.color ?? "var(--muted-foreground)",
                        }}
                      >
                        <CategoryIcon
                          name={category?.icon ?? "tag"}
                          className="size-4"
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {category?.name ?? (isIncome ? "Ingreso" : "Egreso")}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {account?.name ?? "Sin cuenta"}
                          {t.note ? ` · ${t.note}` : ""}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                          <div
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              isIncome
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-foreground",
                            )}
                          >
                            {isIncome ? "+" : "−"}
                            {formatMoney(t.amount, t.currency)}
                          </div>
                          {t.rate_bcv ? (
                            <div className="text-[10px] text-muted-foreground tabular-nums">
                              {t.currency === "USD"
                                ? `Bs ${formatMoney(t.amount * t.rate_bcv, "VES")}`
                                : `$ ${formatMoney(t.amount / t.rate_bcv, "USD")}`}
                            </div>
                          ) : null}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(t.id)}
                          aria-label="Eliminar"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
