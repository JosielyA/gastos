import { getDebts } from "@/lib/data";
import { DebtsManager } from "@/components/debts-manager";

export default async function DeudasPage() {
  const debts = await getDebts();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Deudas</h1>
        <p className="text-sm text-muted-foreground">
          Lo que debes, con o sin fecha de pago.
        </p>
      </div>

      <DebtsManager debts={debts} />
    </div>
  );
}
