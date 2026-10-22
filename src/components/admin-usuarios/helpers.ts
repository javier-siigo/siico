import { AREAS } from "@/lib/navigation";
import { ROLE_CONCILIACIONES, filterAreas } from "@/lib/auth/roles-shared";

export interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  paises: string[];
  lastSignInAt: string | null;
  /** Última request con sesión (tabla `user_activity`, se escribe cada ≥5 min). */
  lastSeenAt: string | null;
}

export interface Draft {
  roles: string[];
  paises: string[];
}

export const EMPTY_DRAFT: Draft = { roles: [], paises: [] };

export const ROLE_META: Record<string, { label: string; description: string }> = {
  admin: {
    label: "Admin",
    description: "Ve todas las áreas y gestiona usuarios y roles.",
  },
  conciliaciones: {
    label: "Conciliaciones",
    description: "Conciliación contable de los países que asignes.",
  },
  ingresos: {
    label: "Ingresos",
    description: "Anticipos, notas crédito, comisiones y bancos.",
  },
};

export const PAIS_LABEL: Record<string, string> = {
  CO: "Colombia",
  MX: "México",
  UY: "Uruguay",
  CL: "Chile",
  EC: "Ecuador",
};

const DAY = 86_400_000;

/** Usuario con registro en `user_roles` pero sin cuenta en Supabase Auth. */
export function isOrphan(user: Pick<AdminUser, "email">) {
  return !user.email.includes("@");
}

export function displayName(email: string) {
  if (!email.includes("@")) return "Usuario huérfano";
  return (email.split("@")[0] ?? email)
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function initials(email: string) {
  if (!email.includes("@")) return "?";
  const parts = (email.split("@")[0] ?? "").split(/[._-]/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function relativeTime(iso: string | null) {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 60) return min <= 1 ? "Hace un momento" : `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "Ayer";
  if (d < 30) return `Hace ${d} días`;
  const m = Math.round(d / 30);
  if (m < 12) return m === 1 ? "Hace 1 mes" : `Hace ${m} meses`;
  const y = Math.round(m / 12);
  return y === 1 ? "Hace 1 año" : `Hace ${y} años`;
}

export function absoluteTime(iso: string | null) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });
}

/** Lo más reciente entre actividad registrada e inicio de sesión. */
export function lastActivity(user: Pick<AdminUser, "lastSeenAt" | "lastSignInAt">) {
  const { lastSeenAt: a, lastSignInAt: b } = user;
  if (!a || !b) return a ?? b;
  return new Date(a) > new Date(b) ? a : b;
}

export function isInactive(iso: string | null) {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > 30 * DAY;
}

/** Problemas de configuración que el admin debería resolver. */
export function issuesFor(user: Pick<AdminUser, "email">, d: Draft): string[] {
  const out: string[] = [];
  if (isOrphan(user)) out.push("Sin cuenta en Auth");
  else if (d.roles.length === 0) out.push("Sin roles");
  if (d.roles.includes(ROLE_CONCILIACIONES) && d.paises.length === 0)
    out.push("Conciliaciones sin países");
  return out;
}

export function accessFor(d: Draft) {
  return filterAreas(d, AREAS).filter((a) => a.slug !== "documentacion");
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

export function isDirty(initial: Draft, current: Draft) {
  return !sameSet(initial.roles, current.roles) || !sameSet(initial.paises, current.paises);
}

export function diffLabels(initial: Draft, current: Draft) {
  const out: { sign: "+" | "−"; label: string }[] = [];
  for (const r of current.roles)
    if (!initial.roles.includes(r)) out.push({ sign: "+", label: ROLE_META[r]?.label ?? r });
  for (const r of initial.roles)
    if (!current.roles.includes(r)) out.push({ sign: "−", label: ROLE_META[r]?.label ?? r });
  for (const p of current.paises)
    if (!initial.paises.includes(p)) out.push({ sign: "+", label: PAIS_LABEL[p] ?? p });
  for (const p of initial.paises)
    if (!current.paises.includes(p)) out.push({ sign: "−", label: PAIS_LABEL[p] ?? p });
  return out;
}

export function toggleRoleIn(d: Draft, role: string): Draft {
  const has = d.roles.includes(role);
  const roles = has ? d.roles.filter((r) => r !== role) : [...d.roles, role];
  const paises = has && role === ROLE_CONCILIACIONES ? [] : d.paises;
  return { roles, paises };
}

/** Marcar un país activa Conciliaciones: no tiene sentido un país sin el rol. */
export function togglePaisIn(d: Draft, code: string): Draft {
  const has = d.paises.includes(code);
  const paises = has ? d.paises.filter((p) => p !== code) : [...d.paises, code];
  const roles = d.roles.includes(ROLE_CONCILIACIONES) ? d.roles : [...d.roles, ROLE_CONCILIACIONES];
  return { roles, paises };
}
