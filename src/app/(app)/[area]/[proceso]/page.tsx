import { notFound } from "next/navigation";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { AREAS, findArea, findProceso } from "@/lib/navigation";

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
  return { title: proc ? `${proc.label} · ${area}` : "Proceso" };
}

export default async function ProcesoPage({ params }: PageProps) {
  const { area, proceso } = await params;
  const areaObj = findArea(area);
  const procObj = findProceso(area, proceso);
  if (!areaObj || !procObj) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={procObj.label}
        description={`${areaObj.label} · ${procObj.description}`}
      />

      <EmptyState
        icon={<procObj.icon className="size-7" />}
        title="Este proceso aún no tiene contenido"
        description="Cuando el equipo configure los parámetros y permisos, aparecerán aquí los pasos a ejecutar."
      />
    </div>
  );
}