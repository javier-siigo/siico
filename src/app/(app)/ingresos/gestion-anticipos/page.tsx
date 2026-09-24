import { AnticiposPageClient } from "@/components/anticipos/anticipos-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getAnticiposAll } from "@/lib/anticipos/actions";

export const metadata = {
  title: "Gestión y Legalización de Anticipos",
};

export default async function GestionAnticiposPage() {
  const rows = await getAnticiposAll();

  return (
    <PageTransition>
      <AnticiposPageClient rows={rows} />
    </PageTransition>
  );
}
