"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "cn";
import type { Category, Currency, Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#22c55e",
  "#eab308",
  "#ec4899",
  "#06b6d4",
];

export function SpendingChart({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const [currency, setCurrency] = useState<Currency>("USD");

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense" || t.currency !== currency) continue;
      const cat = t.category_id
        ? categories.find((c) => c.id === t.category_id)
        : null;
      const name = cat?.name ?? "Sin categoría";
      map.set(name, (map.get(name) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, categories, currency]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Gastos por categoría</h3>
        <div className="flex rounded-lg bg-muted p-0.5">
          {(["USD", "VES"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={cn(
                "rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors",
                currency === c
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {c === "USD" ? "USD" : "Bs"}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin gastos este mes en {currency === "USD" ? "dólares" : "bolívares"}.
        </p>
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={48}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                formatter={(value) => formatMoney(Number(value), currency)}
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
