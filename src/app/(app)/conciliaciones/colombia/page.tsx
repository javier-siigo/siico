import { ConciliacionesPageClient } from "@/components/conciliaciones/conciliaciones-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getBancosPorPais } from "@/lib/conciliaciones/bancos";

export const metadata = {
  title: "Conciliación Colombia",
};

export default async function ConciliacionColombiaPage() {
  const bancos = await getBancosPorPais("CO");

  return (
    <PageTransition>
      <ConciliacionesPageClient pais="CO" bancos={bancos} />
    </PageTransition>
  );
}
