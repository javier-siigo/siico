import { notFound, redirect } from "next/navigation";

import { PageTransition } from "@/components/motion/page-transition";
import { EmptyState } from "@/components/common/empty-state";
import { getUserRoles, requireProcesoAccess } from "@/lib/auth/roles";
import { AREAS, findProceso } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  const roles = await getUserRoles(data.claims.sub);
  await requireProcesoAccess(roles, area, procObj);

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