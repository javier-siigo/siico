import { redirect } from "next/navigation";

import { PageTransition } from "@/components/motion/page-transition";
import { getUserRoles, isAdmin } from "@/lib/auth/roles";
import { listUsersWithRoles } from "@/lib/admin/users";
import { createClient } from "@/lib/supabase/server";

import { UsersTable } from "./users-table";

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
            Asigna a cada miembro del equipo los roles del portal. Los
            usuarios con rol <strong>Admin</strong> ven todas las áreas y
            pueden gestionar estos permisos. El rol <strong>Conciliaciones</strong>{" "}
            requiere además seleccionar los países específicos a los que el
            usuario tendrá acceso.
          </p>
        </header>

        <UsersTable users={users} />
      </div>
    </PageTransition>
  );
}