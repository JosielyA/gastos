"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteCategory } from "@/app/actions/categories";
import type { Category } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icon";
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

const ICONS = [
  "tag",
  "utensils",
  "car",
  "zap",
  "home",
  "heart-pulse",
  "gamepad-2",
  "book-open",
  "shirt",
  "shapes",
  "briefcase",
  "laptop",
  "store",
  "coins",
];

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await createCategory({}, new FormData(e.currentTarget));
    setPending(false);
    if (res.error) setError(res.error);
    else {
      toast.success("Categoría agregada");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    const res = await deleteCategory(id);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Categoría eliminada");
      router.refresh();
    }
  }

  const expenses = categories.filter((c) => c.type === "expense");
  const incomes = categories.filter((c) => c.type === "income");

  const renderGroup = (title: string, items: Category[]) => (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {items.map((c, i) => (
          <div
            key={c.id}
            className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border/60" : ""}`}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${c.color}26`, color: c.color }}
            >
              <CategoryIcon name={c.icon} className="size-4" />
            </span>
            <span className="flex-1 text-sm">{c.name}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => remove(c.id)}
              aria-label="Eliminar categoría"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {expenses.length > 0 && renderGroup("Gastos", expenses)}
      {incomes.length > 0 && renderGroup("Ingresos", incomes)}

      <Button className="w-full" onClick={() => setOpen(true)}>
        <Plus /> Agregar categoría
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" placeholder="Ej: Mascotas" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  className={selectCls}
                  defaultValue="expense"
                >
                  <option value="expense">Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="icon">Icono</Label>
                <select
                  id="icon"
                  name="icon"
                  className={selectCls}
                  defaultValue="tag"
                >
                  {ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="color">Color</Label>
              <input
                id="color"
                name="color"
                type="color"
                defaultValue="#64748b"
                className="size-10 cursor-pointer rounded-lg border border-input bg-transparent p-1"
              />
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
    </div>
  );
}
