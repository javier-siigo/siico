import { ConciliacionesPageClient } from "@/components/conciliaciones/conciliaciones-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getBancosPorPais } from "@/lib/conciliaciones/bancos";

export const metadata = {
  title: "Conciliación Ecuador",
};

export default async function ConciliacionEcuadorPage() {
  const bancos = await getBancosPorPais("EC");

  return (
    <PageTransition>
      <ConciliacionesPageClient pais="EC" bancos={bancos} />
    </PageTransition>
  );
}