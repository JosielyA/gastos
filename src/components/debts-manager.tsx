"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Coins, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { createDebt, deleteDebt, updateDebt } from "@/app/actions/debts";
import type { Debt } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
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

const STATUS_LABEL: Record<Debt["status"], string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagada",
};

export function DebtsManager({ debts }: { debts: Debt[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "paid">("all");

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createDebt({}, new FormData(e.currentTarget));
    setPending(false);
    if (res.error) setError(res.error);
    else {
      toast.success("Deuda registrada");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function markPaid(d: Debt) {
    const res = await updateDebt(d.id, { status: "paid", amount_paid: d.amount });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Deuda marcada como pagada");
      router.refresh();
    }
  }

  async function reopen(d: Debt) {
    const res = await updateDebt(d.id, { status: "pending", amount_paid: 0 });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Deuda reabierta");
      router.refresh();
    }
  }

  async function remove(d: Debt) {
    if (!window.confirm("¿Eliminar esta deuda?")) return;
    const res = await deleteDebt(d.id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Deuda eliminada");
      router.refresh();
    }
  }

  async function submitPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!payingDebt) return;
    const formData = new FormData(e.currentTarget);
    const payment = Number(formData.get("payment") || 0);
    if (!payment || payment <= 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }
    const newPaid = (payingDebt.amount_paid ?? 0) + payment;
    const status = newPaid >= payingDebt.amount ? "paid" : "partial";
    const res = await updateDebt(payingDebt.id, { amount_paid: newPaid, status });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Pago registrado");
      setPayingDebt(null);
      router.refresh();
    }
  }

  const filtered = debts.filter((d) =>
    filter === "all" ? true : filter === "open" ? d.status !== "paid" : d.status === "paid",
  );

  const openCount = debts.filter((d) => d.status !== "paid").length;
  const paidCount = debts.filter((d) => d.status === "paid").length;

  const chip = (value: typeof filter, label: string) => (
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {chip("all", `Todas (${debts.length})`)}
        {chip("open", `Pendientes (${openCount})`)}
        {chip("paid", `Pagadas (${paidCount})`)}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay deudas en esta vista.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => {
            const overdue =
              d.due_date && d.due_date < new Date().toISOString().slice(0, 10);
            const remaining = Math.max(0, d.amount - d.amount_paid);
            return (
              <div
                key={d.id}
                className="rounded-xl bg-card p-3 ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{d.description}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {d.due_date && (
                        <span className={cn(overdue && "text-destructive")}>
                          {overdue ? "Venció" : "Vence"} {formatDate(d.due_date)}
                        </span>
                      )}
                      {d.note && <span>· {d.note}</span>}
                    </div>
                  </div>
                  <Badge
                    variant={
                      d.status === "paid"
                        ? "secondary"
                        : overdue
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {STATUS_LABEL[d.status]}
                  </Badge>
                </div>

                <div className="mt-2 flex items-end justify-between">
                  <div className="text-sm">
                    <span className="font-semibold tabular-nums">
                      {formatMoney(remaining, d.currency)}
                    </span>
                    {d.status === "partial" && (
                      <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                        de {formatMoney(d.amount, d.currency)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {d.status !== "paid" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPayingDebt(d)}
                        >
                          <Coins className="size-3.5" />
                          Abonar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markPaid(d)}
                        >
                          <Check className="size-3.5" />
                          Pagar
                        </Button>
                      </>
                    )}
                    {d.status === "paid" && (
                      <Button variant="outline" size="sm" onClick={() => reopen(d)}>
                        <RotateCcw className="size-3.5" />
                        Reabrir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(d)}
                      aria-label="Eliminar deuda"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> Registrar deuda
      </Button>

      {/* Nueva deuda */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva deuda</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="description">¿A quién o qué debes?</Label>
              <Input
                id="description"
                name="description"
                placeholder="Ej: préstamo a Juan, tarjeta..."
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
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Fecha de pago (opcional)</Label>
              <Input id="due_date" name="due_date" type="date" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Nota (opcional)</Label>
              <Input id="note" name="note" placeholder="Detalles..." />
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

      {/* Abonar */}
      <Dialog open={!!payingDebt} onOpenChange={(o) => !o && setPayingDebt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          {payingDebt && (
            <form onSubmit={submitPayment} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {payingDebt.description} — restan{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(
                    Math.max(0, payingDebt.amount - payingDebt.amount_paid),
                    payingDebt.currency,
                  )}
                </span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="payment">Monto a abonar</Label>
                <Input
                  id="payment"
                  name="payment"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Registrar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
