import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { FlagIcon } from "@/lib/flags";
import { AREAS, procesoHref } from "@/lib/navigation";
import { PageTransition } from "@/components/motion/page-transition";
import { EmptyState } from "@/components/common/empty-state";

export const metadata = {
  title: "Inicio",
};

export default function DashboardPage() {
  if (AREAS.length === 0) {
    return (
      <PageTransition>
        <EmptyState
          icon={<LayoutDashboard className="size-7" />}
          title="Aún no hay áreas configuradas"
          description="Cuando el equipo agregue áreas en el panel de navegación, aparecerán aquí como tarjetas con sus procesos disponibles."
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Catálogo de automatizaciones contables. Selecciona un proceso para
          iniciarlo o consulta su historial.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {AREAS.map((area) => (
            <section
              key={area.slug}
              aria-labelledby={`area-${area.slug}-title`}
              className="flex flex-col rounded-lg border border-border bg-card"
            >
              <header className="flex min-w-0 flex-col gap-1 border-b border-border px-5 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <area.icon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <h2
                    id={`area-${area.slug}-title`}
                    className="truncate text-sm font-semibold tracking-tight text-foreground"
                  >
                    {area.label}
                  </h2>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {area.description}
                </p>
              </header>

              <ul role="list" className="flex flex-col divide-y divide-border">
                {area.procesos.map((proceso) => (
                  <li key={proceso.slug} className="min-w-0">
                    <Link
                      href={procesoHref(area.slug, proceso.slug)}
                      transitionTypes={["nav-forward"]}
                      className="group flex min-w-0 items-center gap-3 px-5 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      {proceso.flagCode ? (
                        <FlagIcon
                          code={proceso.flagCode}
                          title={proceso.label}
                          className="size-4 shrink-0 rounded-[2px]"
                        />
                      ) : (
                        <proceso.icon
                          className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                          aria-hidden
                        />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium text-foreground">
                          {proceso.label}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {proceso.description}
                        </span>
                      </div>
                      <span
                        aria-hidden
                        className="shrink-0 text-xs text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}