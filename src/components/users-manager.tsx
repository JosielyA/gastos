"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { inviteUser } from "@/app/actions/users";
import type { Profile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UsersManager({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await inviteUser({}, new FormData(e.currentTarget));
    setPending(false);
    if (res.error) {
      setError(res.error);
      toast.error(res.error);
    } else {
      toast.success("Invitación enviada");
      e.currentTarget.reset();
      router.refresh();
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {p.full_name || p.email}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {p.email}
              </div>
            </div>
            <Badge variant={p.role === "admin" ? "default" : "outline"}>
              {p.role === "admin" ? "Admin" : "Usuario"}
            </Badge>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <Label htmlFor="email">Invitar por correo</Label>
        <div className="flex gap-2">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
          />
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Invitar
          </Button>
        </div>
        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
