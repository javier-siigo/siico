import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getUserRoles } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = { name: "Invitado", email: "" };
  let roles = { roles: [] as string[], paises: [] as string[] };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      redirect("/login");
    }
    const email = (data.claims.email as string | undefined) ?? "";
    const name =
      (data.claims.user_metadata?.name as string | undefined) ||
      email.split("@")[0] ||
      "Usuario";
    user = { name, email };
    roles = await getUserRoles(data.claims.sub as string);
  } catch {
    redirect("/login");
  }

  return (
    <AppShell user={user} roles={roles}>
      {children}
    </AppShell>
  );
}
