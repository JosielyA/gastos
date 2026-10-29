import { Landmark, TrendingUp, Clock } from "lucide-react";
import { formatNumber, formatRelative } from "@/lib/format";
import type { Rates } from "@/lib/types";

export function RatesCard({ rates }: { rates: Rates }) {
  const hasRates = rates.bcv > 0 && rates.parallel > 0;

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Tasa de cambio</h3>
        {rates.updated_at && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatRelative(rates.updated_at)}
          </span>
        )}
      </div>

      {hasRates ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Landmark className="size-3.5" />
              BCV (oficial)
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              Bs {formatNumber(rates.bcv, "VES")}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" />
              Paralelo (Binance)
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
              Bs {formatNumber(rates.parallel, "VES")}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No se pudieron cargar las tasas. Revisa tu conexión o configúralas
          manualmente en Ajustes.
        </p>
      )}
    </div>
  );
}
