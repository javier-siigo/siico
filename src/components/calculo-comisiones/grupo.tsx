import { cn } from "@/lib/utils";

/**
 * Ingreso (lo que dicen las facturas) y gasto (lo que se amortiza de las
 * comisiones) se distinguen en toda la página con el mismo color.
 */
export const TONO_GRUPO = {
  ingreso: {
    th: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
    dot: "bg-sky-500",
  },
  gasto: {
    th: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
} as const;

export type TonoGrupo = keyof typeof TONO_GRUPO;

export function GrupoTitulo({
  tono,
  as: Tag = "h3",
  children,
  className,
}: {
  tono: TonoGrupo;
  as?: "h2" | "h3";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tag className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", TONO_GRUPO[tono].dot)} />
      {children}
    </Tag>
  );
}
