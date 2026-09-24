import type { LucideIcon } from "lucide-react";
import { HandCoins, Receipt, Scale, TrendingUp } from "lucide-react";

export type Proceso = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  flagCode?: string;
};

export type Area = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  procesos: Proceso[];
};

export const AREAS: Area[] = [
  {
    slug: "conciliaciones",
    label: "Conciliaciones",
    description: "Comparación y cierre contable por país.",
    icon: Scale,
    procesos: [
      {
        slug: "colombia",
        label: "Colombia",
        description: "Conciliación contable para operaciones en Colombia.",
        icon: Scale,
        flagCode: "CO",
      },
      {
        slug: "mexico",
        label: "México",
        description: "Conciliación contable para operaciones en México.",
        icon: Scale,
        flagCode: "MX",
      },
      {
        slug: "uruguay",
        label: "Uruguay",
        description: "Conciliación contable para operaciones en Uruguay.",
        icon: Scale,
        flagCode: "UY",
      },
      {
        slug: "chile",
        label: "Chile",
        description: "Conciliación contable para operaciones en Chile.",
        icon: Scale,
        flagCode: "CL",
      },
    ],
  },
  {
    slug: "ingresos",
    label: "Ingresos",
    description: "Procesos asociados al ciclo de ingresos.",
    icon: TrendingUp,
    procesos: [
      {
        slug: "gestion-anticipos",
        label: "Gestión y Legalización de Anticipos",
        description:
          "Registro y seguimiento de anticipos por colaborador y requerimiento.",
        icon: HandCoins,
      },
      {
        slug: "notas-credito",
        label: "Notas crédito",
        description: "Registro y gestión de notas crédito.",
        icon: Receipt,
      },
    ],
  },
];

export function findArea(areaSlug: string): Area | undefined {
  return AREAS.find((a) => a.slug === areaSlug);
}

export function findProceso(areaSlug: string, procesoSlug: string): Proceso | undefined {
  return findArea(areaSlug)?.procesos.find((p) => p.slug === procesoSlug);
}

export function procesoHref(areaSlug: string, procesoSlug: string): string {
  return `/${areaSlug}/${procesoSlug}`;
}
