import "server-only";

import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import type { Rates } from "@/lib/types";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

interface DolarApiEntry {
  moneda: string;
  fuente: string;
  promedio: number | null;
}

async function fetchFromDolarApi(): Promise<{
  bcv: number;
  parallel: number;
  updated_at: string;
} | null> {
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as DolarApiEntry[];
    const oficial = data.find((d) => d.fuente === "oficial")?.promedio;
    const paralelo = data.find((d) => d.fuente === "paralelo")?.promedio;

    if (!oficial || !paralelo) return null;

    return {
      bcv: oficial,
      parallel: paralelo,
      updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getRates(): Promise<Rates> {
  // 1. Si hay service role, intentamos usar la caché en base de datos.
  if (hasServiceRole()) {
    try {
      const admin = createAdminClient();
      const { data: cached } = await admin
        .from("exchange_rates")
        .select("source, value, updated_at");

      const bcvRow = cached?.find((r) => r.source === "bcv");
      const parRow = cached?.find((r) => r.source === "parallel");
      const cacheTime = bcvRow?.updated_at
        ? new Date(bcvRow.updated_at).getTime()
        : 0;
      const isFresh = Date.now() - cacheTime < CACHE_TTL_MS;

      if (isFresh && bcvRow && parRow) {
        return {
          bcv: bcvRow.value,
          parallel: parRow.value,
          updated_at: bcvRow.updated_at,
        };
      }

      const fetched = await fetchFromDolarApi();
      if (fetched) {
        await admin.from("exchange_rates").upsert(
          [
            { source: "bcv", value: fetched.bcv, updated_at: fetched.updated_at },
            {
              source: "parallel",
              value: fetched.parallel,
              updated_at: fetched.updated_at,
            },
          ],
          { onConflict: "source" },
        );
        return {
          bcv: fetched.bcv,
          parallel: fetched.parallel,
          updated_at: fetched.updated_at,
        };
      }

      if (bcvRow && parRow) {
        return {
          bcv: bcvRow.value,
          parallel: parRow.value,
          updated_at: bcvRow.updated_at,
        };
      }
    } catch {
      // si falla la caché, seguimos con la petición directa
    }
  }

  // 2. Sin service role o si la caché falló: petición directa.
  const fetched = await fetchFromDolarApi();
  if (fetched) return fetched;
  return { bcv: 0, parallel: 0, updated_at: null };
}
