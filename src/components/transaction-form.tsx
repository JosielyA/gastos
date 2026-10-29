"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "cn";
import { createTransaction, type ActionState } from "@/app/actions/transactions";
import type { Account, Category, Rates } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber } from "@/lib/format";

const initialState: ActionState = {};

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function TransactionForm({
  accounts,
  categories,
  initialRates,
}: {
  accounts: Account[];
  categories: Category[];
  initialRates: Rates;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createTransaction,
    initialState,
  );

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const [rates, setRates] = useState<Rates>(initialRates);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => {
        if (d?.bcv) setRates(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (state.success) {
      router.push("/movimientos");
      router.refresh();
    }
  }, [state.success, router]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const effectiveCurrency = selectedAccount ? selectedAccount.currency : currency;
  const filteredCategories = categories.filter((c) => c.type === type);

  const amt = Number(amount) || 0;
  let preview: string | null = null;
  if (amt > 0 && rates.bcv > 0 && rates.parallel > 0) {
    preview =
      effectiveCurrency === "USD"
        ? `≈ Bs ${formatNumber(amt * rates.bcv, "VES")} (BCV) · Bs ${formatNumber(amt * rates.parallel, "VES")} (Paralelo)`
        : `≈ $ ${formatNumber(amt / rates.bcv, "USD")} (BCV) · $ ${formatNumber(amt / rates.parallel, "USD")} (Paralelo)`;
  }

  const toggleBtn = (active: boolean) =>
    cn(
      "flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-input bg-transparent text-muted-foreground",
    );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="currency" value={effectiveCurrency} />

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={toggleBtn(type === "expense")}
        >
          Egreso
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={toggleBtn(type === "income")}
        >
          Ingreso
        </button>
      </div>

      {/* Monto */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Monto</Label>
        <div className="relative">
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-12 pr-12 text-lg font-semibold tabular-nums"
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            {effectiveCurrency === "USD" ? "$" : "Bs"}
          </span>
        </div>
        {preview && (
          <p className="text-xs text-muted-foreground">{preview}</p>
        )}
      </div>

      {/* Cuenta */}
      <div className="space-y-1.5">
        <Label htmlFor="account">Cuenta</Label>
        <select
          id="account"
          name="account_id"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={selectCls}
        >
          <option value="">Sin cuenta (efectivo)</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency === "USD" ? "USD" : "Bs"})
            </option>
          ))}
        </select>
      </div>

      {/* Moneda (solo si no hay cuenta) */}
      {!selectedAccount && (
        <div className="space-y-1.5">
          <Label>Moneda</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={toggleBtn(currency === "USD")}
            >
              Dólares ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency("VES")}
              className={toggleBtn(currency === "VES")}
            >
              Bolívares (Bs)
            </button>
          </div>
        </div>
      )}

      {/* Categoría */}
      <div className="space-y-1.5">
        <Label htmlFor="category">Categoría</Label>
        <select id="category" name="category_id" className={selectCls} defaultValue="">
          <option value="">Sin categoría</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div className="space-y-1.5">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="h-10"
        />
      </div>

      {/* Nota */}
      <div className="space-y-1.5">
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input
          id="note"
          name="note"
          placeholder="Ej: mercado, pago de luz..."
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Guardar {type === "expense" ? "egreso" : "ingreso"}
      </Button>
    </form>
  );
}
