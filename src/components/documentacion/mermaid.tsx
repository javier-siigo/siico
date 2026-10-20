"use client";

import { useEffect, useId, useState } from "react";

import { useTheme } from "@/components/layout/theme-provider";

import { CodeBlock } from "./code-block";

/**
 * Diagrama ```mermaid. La librería se carga solo en el cliente y se vuelve a
 * dibujar al cambiar el tema claro/oscuro.
 */
export function Mermaid({ code }: { code: string }) {
  const { resolvedTheme } = useTheme();
  const rawId = useId();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "neutral",
          fontFamily: "var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif",
          // Tamaño natural: encogido al ancho de la columna el texto queda ilegible;
          // el contenedor se desplaza en horizontal si no cabe.
          // Mermaid escribe el tamaño en línea desde esta opción global.
          fontSize: 13,
          flowchart: { useMaxWidth: false },
          sequence: { useMaxWidth: false, actorMargin: 24 },
        });
        // useId trae ":" y mermaid lo usa como selector.
        const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}-${resolvedTheme}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelado) {
          setSvg(svg);
          setError(false);
        }
      } catch {
        if (!cancelado) setError(true);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [code, rawId, resolvedTheme]);

  if (error) return <CodeBlock code={code} lang="mermaid" />;

  return (
    <figure className="my-5 overflow-x-auto rounded-md border border-border bg-background p-4">
      {svg ? (
        <div
          className="flex w-max min-w-full justify-center [&_svg]:h-auto"
          // SVG generado por mermaid con securityLevel "strict" (sanitizado con DOMPurify).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div
          className="h-48 animate-pulse rounded bg-muted/60"
          role="status"
          aria-label="Cargando diagrama"
        />
      )}
    </figure>
  );
}
