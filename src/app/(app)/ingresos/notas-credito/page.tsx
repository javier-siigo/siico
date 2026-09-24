import { NotasCreditoPageClient } from "@/components/notas-credito/notas-credito-page";
import { PageTransition } from "@/components/motion/page-transition";

export const metadata = {
  title: "Notas crédito",
};

export default function NotasCreditoPage() {
  return (
    <PageTransition>
      <NotasCreditoPageClient />
    </PageTransition>
  );
}
