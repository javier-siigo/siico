import { notFound } from "next/navigation";

import { PageTransition } from "@/components/motion/page-transition";
import { EmptyState } from "@/components/common/empty-state";
import { AREAS, findProceso } from "@/lib/navigation";

interface PageProps {
  params: Promise<{ area: string; proceso: string }>;
}

export function generateStaticParams() {
  return AREAS.flatMap((area) =>
    area.procesos.map((proceso) => ({ area: area.slug, proceso: proceso.slug })),
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { area, proceso } = await params;
  const proc = findProceso(area, proceso);
  return { title: proc ? proc.label : "Proceso" };
}

export default async function ProcesoPage({ params }: PageProps) {
  const { area, proceso } = await params;
  const procObj = findProceso(area, proceso);
  if (!procObj) notFound();

  return (
    <PageTransition>
      <EmptyState
        icon={<procObj.icon className="size-7" />}
        title="Este proceso aún no tiene contenido"
        description="Cuando el equipo configure los parámetros y permisos, aparecerán aquí los pasos a ejecutar."
      />
    </PageTransition>
  );
}