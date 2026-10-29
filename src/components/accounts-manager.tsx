"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAccount,
  deleteAccount,
  quickCreateAccount,
} from "@/app/actions/accounts";
import type { Account } from "@/lib/types";
import { formatMoney } from "@/lib/format";
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

const QUICK_ACCOUNTS: {
  name: string;
  type: "bank" | "wallet";
  currency: "USD" | "VES";
}[] = [
  { name: "Banesco", type: "bank", currency: "VES" },
  { name: "BNC", type: "bank", currency: "VES" },
  { name: "Provincial", type: "bank", currency: "VES" },
  { name: "Bybit", type: "wallet", currency: "USD" },
  { name: "Binance", type: "wallet", currency: "USD" },
  { name: "Zinli", type: "wallet", currency: "USD" },
];

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function AccountsManager({
  accounts,
}: {
  accounts: (Account & { balance: number })[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createAccount({}, formData);
    setPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      toast.success("Cuenta agregada");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta cuenta?")) return;
    const res = await deleteAccount(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Cuenta eliminada");
      router.refresh();
    }
  }

  async function handleQuick(a: (typeof QUICK_ACCOUNTS)[number]) {
    const res = await quickCreateAccount(a.name, a.type, a.currency);
    if (res.error) toast.error(res.error);
    else {
      toast.success(`Cuenta "${a.name}" agregada`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Agregar rápido:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACCOUNTS.map((a) => (
            <button
              key={a.name}
              type="button"
              onClick={() => handleQuick(a)}
              className="rounded-full border border-input px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              + {a.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No tienes cuentas todavía.
          </div>
        ) : (
          accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 ring-1 ring-foreground/10"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {a.type === "bank" ? (
                  <Landmark className="size-4" />
                ) : (
                  <CreditCard className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">
                  {a.type === "bank" ? "Banco" : "Billetera"} ·{" "}
                  {a.currency === "USD" ? "USD" : "Bolívares"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">
                  {formatMoney(a.balance, a.currency)}
                </div>
                <Badge variant="secondary" className="mt-0.5 text-[10px]">
                  Saldo
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(a.id)}
                aria-label="Eliminar cuenta"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> Agregar cuenta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: Banesco, Binance..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className={selectCls}
                  defaultValue="bank"
                >
                  <option value="bank">Banco</option>
                  <option value="wallet">Billetera</option>
                </select>
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
              <Label htmlFor="initial_balance">Saldo inicial (opcional)</Label>
              <Input
                id="initial_balance"
                name="initial_balance"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
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
