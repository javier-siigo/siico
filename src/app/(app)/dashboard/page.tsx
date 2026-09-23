import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { KpiGrid, KpiTile } from "@/components/dashboard/kpi-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AREAS, procesoHref } from "@/lib/navigation";

export const metadata = {
  title: "Inicio",
};

export default async function DashboardPage() {
  let displayName = "Contador";
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const email = (data?.claims?.email as string | undefined) ?? "";
    const meta = data?.claims?.user_metadata as { name?: string } | undefined;
    displayName = meta?.name || email.split("@")[0] || "Contador";
  } catch {
    displayName = "Contador";
  }

  const totalProcesos = AREAS.reduce((acc, a) => acc + a.procesos.length, 0);
  const paisesCubiertos =
    AREAS.find((a) => a.slug === "conciliaciones")?.procesos.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Hola, ${displayName}`}
        description="Accede a los procesos contables por área. Cada proceso abre su propia vista con los pasos y parámetros configurados."
      />

      <KpiGrid>
        <KpiTile label="Áreas" value={AREAS.length} context="Disponibles" />
        <KpiTile
          label="Procesos"
          value={totalProcesos}
          context="Configurables"
        />
        <KpiTile
          label="Países cubiertos"
          value={paisesCubiertos}
          context="Conciliaciones"
        />
        <KpiTile
          label="Última ejecución"
          value="—"
          context="Sin datos aún"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {AREAS.map((area) => (
          <Card key={area.slug} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <area.icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <CardTitle>{area.label}</CardTitle>
                  <CardDescription>{area.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                {area.procesos.map((proceso) => (
                  <li key={proceso.slug} className="min-w-0">
                    <Link
                      href={procesoHref(area.slug, proceso.slug)}
                      className="group flex h-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <proceso.icon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                        <span className="min-w-0 truncate font-medium">
                          {proceso.label}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Abrir →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}