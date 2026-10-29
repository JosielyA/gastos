"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBudget, upsertBudget } from "@/app/actions/budgets";
import type { Budget, Category, Transaction } from "@/lib/types";
import { currentMonth, formatMoney, monthLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BudgetsManager({
  budgets,
  categories,
  transactions,
}: {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const spentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || !t.category_id) continue;
      const key = `${t.category_id}:${t.date.slice(0, 7)}`;
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return map;
  }, [transactions]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const categoryId = (formData.get("category_id") as string) || null;
    const month = (formData.get("month") as string) || currentMonth();
    const limitAmount = Number(formData.get("limit_amount") || 0);
    const currency = (formData.get("currency") as "USD" | "VES") || "USD";
    const res = await upsertBudget(categoryId, month, limitAmount, currency);
    setPending(false);
    if (res.error) setError(res.error);
    else {
      toast.success("Presupuesto guardado");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este presupuesto?")) return;
    const res = await deleteBudget(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Presupuesto eliminado");
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      {budgets.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No tienes presupuestos todavía.
        </div>
      ) : (
        budgets.map((b) => {
          const cat = b.category_id ? categoryMap.get(b.category_id) : null;
          const spent = spentMap.get(`${b.category_id}:${b.month}`) ?? 0;
          const pct =
            b.limit_amount > 0
              ? Math.min(100, Math.round((spent / b.limit_amount) * 100))
              : 0;
          const over = spent > b.limit_amount;
          return (
            <div
              key={b.id}
              className="rounded-xl bg-card p-3 ring-1 ring-foreground/10"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {cat?.name ?? "Sin categoría"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {monthLabel(b.month)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold tabular-nums ${over ? "text-destructive" : ""}`}
                    >
                      {formatMoney(spent, b.currency)} /{" "}
                      {formatMoney(b.limit_amount, b.currency)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(b.id)}
                    aria-label="Eliminar presupuesto"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })
      )}

      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> Agregar presupuesto
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="category_id">Categoría</Label>
              <select
                id="category_id"
                name="category_id"
                className={selectCls}
                defaultValue=""
              >
                <option value="">Todas (gasto general)</option>
                {categories
                  .filter((c) => c.type === "expense")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="month">Mes</Label>
                <Input
                  id="month"
                  name="month"
                  type="month"
                  defaultValue={currentMonth()}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  name="currency"
                  className={selectCls}
                  defaultValue="USD"
                >
                  <option value="USD">USD ($)</option>
                  <option value="VES">Bolívares (Bs)</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="limit_amount">Límite</Label>
              <Input
                id="limit_amount"
                name="limit_amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
