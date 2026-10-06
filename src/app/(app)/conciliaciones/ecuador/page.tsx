import { redirect } from "next/navigation";

import { ConciliacionesPageClient } from "@/components/conciliaciones/conciliaciones-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getBancosPorPais } from "@/lib/conciliaciones/bancos";
import { getUserRoles, requireProcesoAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Conciliación Ecuador",
};

export default async function ConciliacionEcuadorPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  const roles = await getUserRoles(data.claims.sub);
  await requireProcesoAccess(roles, "conciliaciones", {
    slug: "ecuador",
    flagCode: "EC",
  });

  const bancos = await getBancosPorPais("EC");

  return (
    <PageTransition>
      <ConciliacionesPageClient pais="EC" bancos={bancos} />
    </PageTransition>
  );
}