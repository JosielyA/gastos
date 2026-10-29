"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Coins,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import { createWish, deleteWish, updateWish } from "@/app/actions/wishes";
import type { Wish } from "@/lib/types";
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

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-transparent px-2.5 text-base text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const PRIORITY_LABEL: Record<Wish["priority"], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export function WishesManager({ wishes }: { wishes: Wish[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [goalWish, setGoalWish] = useState<Wish | null>(null);
  const [filter, setFilter] = useState<"all" | "wishlist" | "saving" | "bought">(
    "all",
  );

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createWish({}, new FormData(e.currentTarget));
    setPending(false);
    if (res.error) setError(res.error);
    else {
      toast.success("Deseo agregado");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function setStatus(w: Wish, status: Wish["status"]) {
    const res = await updateWish(w.id, { status });
    if (res.error) toast.error(res.error);
    else {
      toast.success(
        status === "saving"
          ? "Empezaste a ahorrar"
          : status === "bought"
            ? "¡Comprado! 🎉"
            : "Devuelto a la lista",
      );
      router.refresh();
    }
  }

  async function remove(w: Wish) {
    if (!window.confirm("¿Eliminar este deseo?")) return;
    const res = await deleteWish(w.id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Deseo eliminado");
      router.refresh();
    }
  }

  async function submitGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!goalWish) return;
    const goal = Number(new FormData(e.currentTarget).get("goal") || 0);
    if (!goal || goal < 0) {
      toast.error("Ingresa un monto válido.");
      return;
    }
    const res = await updateWish(goalWish.id, { goal });
    if (res.error) toast.error(res.error);
    else {
      toast.success("Meta actualizada");
      setGoalWish(null);
      router.refresh();
    }
  }

  const filtered = wishes.filter((w) =>
    filter === "all" ? true : w.status === filter,
  );

  const chip = (value: typeof filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        filter === value
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {chip("all", "Todos")}
        {chip("wishlist", "Deseos")}
        {chip("saving", "Ahorrando")}
        {chip("bought", "Comprados")}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay deseos en esta vista.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => {
            const price = w.price ?? 0;
            const goal = w.goal ?? 0;
            const pct =
              price > 0 ? Math.min(100, Math.round((goal / price) * 100)) : 0;
            return (
              <div
                key={w.id}
                className="rounded-xl bg-card p-3 ring-1 ring-foreground/10"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{w.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge
                        variant={
                          w.priority === "high"
                            ? "destructive"
                            : w.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {PRIORITY_LABEL[w.priority]}
                      </Badge>
                      {price > 0 ? (
                        <span className="tabular-nums">
                          {formatMoney(price, w.currency ?? "USD")}
                        </span>
                      ) : (
                        <span>Sin precio</span>
                      )}
                      {w.status === "bought" && (
                        <Badge variant="outline" className="text-[10px]">
                          Comprado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Sparkles className="size-4 shrink-0 text-muted-foreground" />
                </div>

                {w.status === "saving" && price > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Ahorrado: {formatMoney(goal, w.currency ?? "USD")}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {pct}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end gap-1">
                  {w.status === "wishlist" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(w, "saving")}
                    >
                      <Coins className="size-3.5" />
                      Ahorrar
                    </Button>
                  )}
                  {w.status === "saving" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGoalWish(w)}
                      >
                        <Coins className="size-3.5" />
                        Meta
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatus(w, "bought")}
                      >
                        <Check className="size-3.5" />
                        Comprar
                      </Button>
                    </>
                  )}
                  {w.status === "bought" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(w, "wishlist")}
                    >
                      <RotateCcw className="size-3.5" />
                      Volver
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(w)}
                    aria-label="Eliminar deseo"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> Agregar deseo
      </Button>

      {/* Nuevo deseo */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo deseo</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">¿Qué quieres comprar?</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: un teléfono, un viaje..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Precio (opcional)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
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
              <Label htmlFor="priority">Prioridad</Label>
              <select
                id="priority"
                name="priority"
                className={selectCls}
                defaultValue="medium"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link">Enlace (opcional)</Label>
              <Input id="link" name="link" placeholder="https://..." />
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

      {/* Meta */}
      <Dialog open={!!goalWish} onOpenChange={(o) => !o && setGoalWish(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meta de ahorro</DialogTitle>
          </DialogHeader>
          {goalWish && (
            <form onSubmit={submitGoal} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {goalWish.name} — llevas{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(goalWish.goal ?? 0, goalWish.currency ?? "USD")}
                </span>
                {goalWish.price ? (
                  <>
                    {" "}
                    de{" "}
                    <span className="font-medium text-foreground">
                      {formatMoney(goalWish.price, goalWish.currency ?? "USD")}
                    </span>
                  </>
                ) : null}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="goal">Total ahorrado</Label>
                <Input
                  id="goal"
                  name="goal"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  defaultValue={goalWish.goal ?? 0}
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Guardar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
