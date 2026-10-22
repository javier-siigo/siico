import { redirect } from "next/navigation";

import { UsuariosPage } from "@/components/admin-usuarios/usuarios-page";
import { PageTransition } from "@/components/motion/page-transition";
import { getUserRoles, isAdmin } from "@/lib/auth/roles";
import { listUsersWithRoles } from "@/lib/admin/users";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Usuarios y roles",
};

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");
  const roles = await getUserRoles(data.claims.sub);
  if (!isAdmin(roles)) redirect("/dashboard");

  const users = await listUsersWithRoles();

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Usuarios y roles
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Decide qué puede ver cada persona del equipo. <strong>Admin</strong> ve
            todas las áreas y gestiona estos permisos; <strong>Conciliaciones</strong>{" "}
            solo abre los países que marques.
          </p>
        </header>

        <UsuariosPage users={users} currentUserId={data.claims.sub} />
      </div>
    </PageTransition>
  );
}
