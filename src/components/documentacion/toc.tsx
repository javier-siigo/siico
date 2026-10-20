"use client";

import { useEffect, useState } from "react";

import type { EntradaToc } from "@/lib/documentacion/contenido";
import { cn } from "@/lib/utils";

/** Tabla de contenidos de los `##` y `###`, con la sección visible resaltada. */
export function Toc({ entradas }: { entradas: EntradaToc[] }) {
  const [activo, setActivo] = useState<string | null>(entradas[0]?.id ?? null);

  useEffect(() => {
    const elementos = entradas
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elementos.length === 0) return;
    let frame = 0;
    // La sección activa es el último encabezado que ya pasó bajo la barra
    // superior; al llegar al final de la página, el último.
    const calcular = () => {
      frame = 0;
      const alFinal =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let actual = elementos[0]!.id;
      if (alFinal) {
        actual = elementos[elementos.length - 1]!.id;
      } else {
        for (const el of elementos) {
          if (el.getBoundingClientRect().top <= 96) actual = el.id;
          else break;
        }
      }
      setActivo(actual);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [entradas]);

  if (entradas.length === 0) return null;

  return (
    <nav aria-label="En este documento" className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        En este documento
      </span>
      <ul className="flex flex-col border-l border-border">
        {entradas.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              aria-current={activo === e.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 text-[13px] leading-5 transition-colors",
                e.nivel === 3 ? "pl-6" : "pl-3",
                activo === e.id
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {e.texto}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
