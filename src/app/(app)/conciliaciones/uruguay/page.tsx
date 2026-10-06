import { ConciliacionesPageClient } from "@/components/conciliaciones/conciliaciones-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getBancosPorPais } from "@/lib/conciliaciones/bancos";

export const metadata = {
  title: "Conciliación Uruguay",
};

export default async function ConciliacionUruguayPage() {
  const bancos = await getBancosPorPais("UY");

  return (
    <PageTransition>
      <ConciliacionesPageClient pais="UY" bancos={bancos} />
    </PageTransition>
  );
}