import { getAccounts, getTransactions } from "@/lib/data";
import { AccountsManager } from "@/components/accounts-manager";

export default async function CuentasPage() {
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getTransactions(),
  ]);

  const balances = new Map<string, number>();
  for (const a of accounts) balances.set(a.id, a.initial_balance);
  for (const t of transactions) {
    if (!t.account_id) continue;
    const delta = t.type === "income" ? t.amount : -t.amount;
    balances.set(t.account_id, (balances.get(t.account_id) ?? 0) + delta);
  }

  const accountsWithBalance = accounts.map((a) => ({
    ...a,
    balance: balances.get(a.id) ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Cuentas</h1>
        <p className="text-sm text-muted-foreground">
          Tus bancos y billeteras.
        </p>
      </div>

      <AccountsManager accounts={accountsWithBalance} />
    </div>
  );
}
