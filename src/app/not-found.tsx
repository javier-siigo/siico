import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md space-y-4 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Esta página no existe
        </h1>
        <p className="text-sm text-muted-foreground">
          La ruta solicitada no forma parte del portal o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  );
}
