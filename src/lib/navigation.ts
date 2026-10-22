import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calculator,
  FileText,
  HandCoins,
  Landmark,
  Receipt,
  Scale,
  Settings,
  TrendingUp,
} from "lucide-react";

import { DOCUMENTOS } from "@/lib/documentacion/registry";

export type Proceso = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  flagCode?: string;
  /** Roles que dan acceso (además de admin); vacío = cualquier usuario autenticado. Solo Documentación. */
  roles?: readonly string[];
};

export type Area = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  procesos: Proceso[];
  /** Se abre desde el menú de usuario, no desde la barra lateral. */
  enMenuUsuario?: boolean;
};

export const AREAS: Area[] = [
  {
    slug: "conciliaciones",
    label: "Conciliaciones",
    description: "Comparación y cierre contable por país.",
    icon: Scale,
    procesos: [
      {
        slug: "chile",
        label: "Chile",
        description: "Conciliación contable para operaciones en Chile.",
        icon: Scale,
        flagCode: "CL",
      },
      {
        slug: "colombia",
        label: "Colombia",
        description: "Conciliación contable para operaciones en Colombia.",
        icon: Scale,
        flagCode: "CO",
      },
      {
        slug: "ecuador",
        label: "Ecuador",
        description: "Conciliación contable para operaciones en Ecuador.",
        icon: Scale,
        flagCode: "EC",
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
      {
        slug: "calculo-comisiones",
        label: "Cálculo de Comisiones",
        description:
          "Procesamiento y control mensual del reconocimiento de comisiones.",
        icon: Calculator,
      },
      {
        slug: "export-bancos",
        label: "Auditoría Asientos de Diario",
        description:
          "Exporta a Excel las líneas contables de NetSuite de un periodo: bancos o, por tipo de cuenta, todos los documentos.",
        icon: Landmark,
      },
    ],
  },
  {
    slug: "documentacion",
    label: "Documentación",
    description: "Cómo funciona cada proceso del portal.",
    icon: BookOpen,
    enMenuUsuario: true,
    procesos: DOCUMENTOS.map((d) => ({
      slug: d.slug,
      label: d.titulo,
      description: d.descripcion,
      icon: FileText,
      roles: d.roles,
    })),
  },
  {
    slug: "admin",
    label: "Administración",
    description: "Configuración interna del portal.",
    icon: Settings,
    enMenuUsuario: true,
    procesos: [
      {
        slug: "usuarios",
        label: "Usuarios y roles",
        description: "Asigna roles y permisos a los miembros del equipo.",
        icon: Settings,
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
