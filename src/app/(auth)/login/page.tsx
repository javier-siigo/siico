import { Calculator } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { PageTransition } from "@/components/motion/page-transition";

export const metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <PageTransition>
      <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Calculator className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">SIICO</p>
              <p className="text-xs text-muted-foreground">Automatizaciones contables</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Portal interno
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Gobierno y operación de tus automatizaciones contables en un solo lugar.
            </h1>
            <p className="text-sm text-muted-foreground">
              Ejecuta flujos desde n8n, consulta el historial y mantén trazabilidad sin
              compartir credenciales ni endpoints con el equipo.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Acceso restringido al equipo contable de Siigo.
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Calculator className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold">SIICO</p>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Iniciar sesión</h2>
              <p className="text-sm text-muted-foreground">
                Usa tu correo corporativo y la contraseña registrada en Supabase.
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-xs text-muted-foreground">
              ¿Problemas para entrar? Contacta al administrador del portal.
            </p>
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
