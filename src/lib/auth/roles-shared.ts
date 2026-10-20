import type { Area, Proceso } from "@/lib/navigation";

export const ROLE_ADMIN = "admin";
export const ROLE_CONCILIACIONES = "conciliaciones";
export const ROLE_INGRESOS = "ingresos";

export const ALL_ROLES = [
  ROLE_ADMIN,
  ROLE_CONCILIACIONES,
  ROLE_INGRESOS,
] as const;

export const KNOWN_PAISES = ["CO", "MX", "UY", "CL", "EC"] as const;

export type RoleName = (typeof ALL_ROLES)[number];
export type PaisCode = (typeof KNOWN_PAISES)[number];

export interface UserRolesInfo {
  roles: string[];
  paises: string[];
}

export const EMPTY_ROLES: UserRolesInfo = { roles: [], paises: [] };

export function isAdmin(info: UserRolesInfo): boolean {
  return info.roles.includes(ROLE_ADMIN);
}

export function hasRole(info: UserRolesInfo, role: string): boolean {
  return info.roles.includes(role);
}

export function canAccessArea(
  info: UserRolesInfo,
  areaSlug: string,
): boolean {
  if (isAdmin(info)) return true;
  if (areaSlug === "documentacion") return true;
  if (areaSlug === "conciliaciones") return hasRole(info, ROLE_CONCILIACIONES);
  if (areaSlug === "ingresos") return hasRole(info, ROLE_INGRESOS);
  if (areaSlug === "admin") return false;
  return false;
}

export function canAccessProceso(
  info: UserRolesInfo,
  areaSlug: string,
  proceso: Pick<Proceso, "slug" | "flagCode" | "roles">,
): boolean {
  if (isAdmin(info)) return true;
  if (areaSlug === "documentacion") {
    const roles = proceso.roles ?? [];
    return roles.length === 0 || roles.some((r) => hasRole(info, r));
  }
  if (areaSlug === "conciliaciones" && proceso.flagCode) {
    return (
      hasRole(info, ROLE_CONCILIACIONES) &&
      info.paises.includes(proceso.flagCode)
    );
  }
  if (areaSlug === "conciliaciones") return false;
  if (areaSlug === "ingresos") return hasRole(info, ROLE_INGRESOS);
  return false;
}

export function filterAreas(info: UserRolesInfo, areas: Area[]): Area[] {
  if (isAdmin(info)) return areas;
  return areas
    .map((area) => {
      if (!canAccessArea(info, area.slug)) return null;
      const procesos = area.procesos.filter((p) =>
        canAccessProceso(info, area.slug, p),
      );
      if (procesos.length === 0) return null;
      return { ...area, procesos };
    })
    .filter((a): a is Area => a !== null);
}