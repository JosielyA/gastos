import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAccounts, getCategories } from "@/lib/data";
import { getRates } from "@/lib/rates";
import { TransactionForm } from "@/components/transaction-form";

export const metadata: Metadata = { title: "Nuevo movimiento" };

export default async function NuevoMovimientoPage() {
  const [accounts, categories, rates] = await Promise.all([
    getAccounts(),
    getCategories(),
    getRates(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/movimientos"
          className="flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Volver"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Nuevo movimiento
          </h1>
          <p className="text-sm text-muted-foreground">
            Registra un ingreso o egreso.
          </p>
        </div>
      </div>

      <TransactionForm
        accounts={accounts}
        categories={categories}
        initialRates={rates}
      />
    </div>
  );
}
