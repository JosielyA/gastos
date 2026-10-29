"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createRecurring,
  deleteRecurring,
  toggleRecurring,
} from "@/app/actions/recurring";
import type { Account, Category, Recurring } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const FREQ_LABEL: Record<Recurring["frequency"], string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

export function RecurringManager({
  recurring,
  accounts,
  categories,
}: {
  recurring: Recurring[];
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createRecurring({}, new FormData(e.currentTarget));
    setPending(false);
    if (res.error) setError(res.error);
    else {
      toast.success("Movimiento recurrente agregado");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function toggle(r: Recurring, active: boolean) {
    const res = await toggleRecurring(r.id, active);
    if (res.error) toast.error(res.error);
    else router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este movimiento recurrente?")) return;
    const res = await deleteRecurring(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Eliminado");
      router.refresh();
    }
  }

  const accountName = (id: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? "—";

  return (
    <div className="space-y-2">
      {recurring.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No tienes movimientos recurrentes.
        </div>
      ) : (
        recurring.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {r.description}
                </span>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {FREQ_LABEL[r.frequency]}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {r.type === "income" ? "Ingreso" : "Gasto"} ·{" "}
                {accountName(r.account_id)} · próximo{" "}
                {formatDate(r.next_date)}
              </div>
            </div>
            <span
              className={`text-sm font-semibold tabular-nums ${r.type === "income" ? "text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {formatMoney(r.amount, r.currency)}
            </span>
            <Switch
              checked={r.active}
              onCheckedChange={(v) => toggle(r, v)}
              aria-label="Activar"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(r.id)}
              aria-label="Eliminar"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))
      )}

      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> Agregar recurrente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo movimiento recurrente</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                placeholder="Ej: Netflix, sueldo..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className={selectCls}
                  defaultValue="expense"
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="frequency">Frecuencia</Label>
                <select
                  id="frequency"
                  name="frequency"
                  className={selectCls}
                  defaultValue="monthly"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_id">Cuenta (opcional)</Label>
              <select
                id="account_id"
                name="account_id"
                className={selectCls}
                defaultValue=""
              >
                <option value="">Sin cuenta</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category_id">Categoría (opcional)</Label>
              <select
                id="category_id"
                name="category_id"
                className={selectCls}
                defaultValue=""
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_date">Próxima fecha</Label>
              <Input
                id="next_date"
                name="next_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="h-10"
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
