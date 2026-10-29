import { getWishes } from "@/lib/data";
import { WishesManager } from "@/components/wishes-manager";

export default async function DeseosPage() {
  const wishes = await getWishes();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Deseos</h1>
        <p className="text-sm text-muted-foreground">
          Cosas que quieres comprar, con o sin precio.
        </p>
      </div>

      <WishesManager wishes={wishes} />
    </div>
  );
}
