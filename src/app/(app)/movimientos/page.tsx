import Link from "next/link";
import { Plus } from "lucide-react";
import { getAccounts, getCategories, getTransactions } from "@/lib/data";
import { TransactionsView } from "@/components/transactions-view";
import { Button } from "@/components/ui/button";

export default async function MovimientosPage() {
  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            Tus ingresos y egresos.
          </p>
        </div>
        <Button asChild>
          <Link href="/movimientos/nuevo">
            <Plus />
            Nuevo
          </Link>
        </Button>
      </div>

      <TransactionsView
        transactions={transactions}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
