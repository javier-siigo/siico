"use client";

import * as React from "react";
import { toast } from "sonner";
import { Save, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALL_ROLES, KNOWN_PAISES, ROLE_CONCILIACIONES } from "@/lib/auth/roles-shared";
import { updateUserRoles } from "@/lib/admin/users";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  roles: string[];
  paises: string[];
  lastSignInAt: string | null;
}

interface UsersTableProps {
  users: UserRow[];
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  conciliaciones: "Conciliaciones",
  ingresos: "Ingresos",
};

const PAIS_LABEL: Record<string, string> = {
  CO: "Colombia",
  MX: "México",
  UY: "Uruguay",
  CL: "Chile",
  EC: "Ecuador",
};

export function UsersTable({ users }: UsersTableProps) {
  const [draft, setDraft] = React.useState<Record<string, { roles: string[]; paises: string[] }>>(
    () =>
      Object.fromEntries(
        users.map((u) => [u.id, { roles: [...u.roles], paises: [...u.paises] }]),
      ),
  );
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const isDirty = (id: string) => {
    const initial = users.find((u) => u.id === id);
    const current = draft[id];
    if (!initial || !current) return false;
    const sameRoles =
      initial.roles.length === current.roles.length &&
      initial.roles.every((r) => current.roles.includes(r));
    const samePaises =
      initial.paises.length === current.paises.length &&
      initial.paises.every((p) => current.paises.includes(p));
    return !(sameRoles && samePaises);
  };

  const toggleRole = (userId: string, role: string) => {
    setDraft((prev) => {
      const current = prev[userId] ?? { roles: [], paises: [] };
      const has = current.roles.includes(role);
      const roles = has
          ? current.roles.filter((r) => r !== role)
          : [...current.roles, role];
      const paises =
        !has && role === ROLE_CONCILIACIONES
          ? current.paises
          : has && role === ROLE_CONCILIACIONES
            ? []
            : current.paises;
      return { ...prev, [userId]: { roles, paises } };
    });
  };

  const togglePais = (userId: string, code: string) => {
    setDraft((prev) => {
      const current = prev[userId] ?? { roles: [], paises: [] };
      if (!current.roles.includes(ROLE_CONCILIACIONES)) return prev;
      const has = current.paises.includes(code);
      const paises = has
        ? current.paises.filter((p) => p !== code)
        : [...current.paises, code];
      return { ...prev, [userId]: { ...current, paises } };
    });
  };

  const save = async (userId: string) => {
    const current = draft[userId];
    if (!current) return;
    setSavingId(userId);
    try {
      const result = await updateUserRoles({
        userId,
        roles: current.roles as typeof ALL_ROLES[number][],
        paises: current.paises as typeof KNOWN_PAISES[number][],
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Roles actualizados para ${userId.slice(0, 8)}…`);
    } finally {
      setSavingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No hay usuarios registrados todavía.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[28%]">Usuario</TableHead>
            <TableHead className="w-[26%]">Roles</TableHead>
            <TableHead className="w-[34%]">Países (conciliaciones)</TableHead>
            <TableHead className="w-[12%] text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const d = draft[user.id] ?? { roles: [], paises: [] };
            const dirty = isDirty(user.id);
            const conciliacionesActive = d.roles.includes(ROLE_CONCILIACIONES);
            return (
              <TableRow key={user.id} data-state={dirty ? "selected" : undefined}>
                <TableCell className="align-top">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{user.email}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {user.id}
                    </span>
                    {user.roles.includes("admin") && (
                      <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        <ShieldCheck className="size-3" />
                        Admin
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map((role) => {
                      const checked = d.roles.includes(role);
                      return (
                        <label
                          key={role}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                            checked
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-background text-muted-foreground hover:bg-accent",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 accent-primary"
                            checked={checked}
                            onChange={() => toggleRole(user.id, role)}
                          />
                          {ROLE_LABEL[role] ?? role}
                        </label>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      !conciliacionesActive && "opacity-50",
                    )}
                  >
                    {KNOWN_PAISES.map((code) => {
                      const checked = d.paises.includes(code);
                      const disabled = !conciliacionesActive;
                      return (
                        <label
                          key={code}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                            disabled
                              ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                              : checked
                                ? "cursor-pointer border-primary/40 bg-primary/10 text-primary"
                                : "cursor-pointer border-border bg-background text-muted-foreground hover:bg-accent",
                          )}
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 accent-primary"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => togglePais(user.id, code)}
                          />
                          {PAIS_LABEL[code] ?? code}
                        </label>
                      );
                    })}
                  </div>
                  {!conciliacionesActive && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Activa el rol Conciliaciones para asignar países.
                    </p>
                  )}
                </TableCell>
                <TableCell className="align-top text-right">
                  <Button
                    size="sm"
                    variant={dirty ? "default" : "outline"}
                    disabled={!dirty || savingId === user.id}
                    onClick={() => save(user.id)}
                  >
                    <Save />
                    {savingId === user.id ? "Guardando…" : "Guardar"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}