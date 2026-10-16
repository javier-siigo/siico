"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProgresoLectura } from "@/lib/comisiones/informe-diferido";
import type {
  MensajeEntrada,
  MensajeSalida,
} from "@/lib/comisiones/informe-diferido.worker";
import type { ResultadoArchivo } from "@/lib/comisiones/types";

export type EstadoLectura =
  | { estado: "vacio" }
  | { estado: "leyendo"; archivo: File; progreso: ProgresoLectura }
  | { estado: "listo"; resultado: ResultadoArchivo }
  | { estado: "error"; archivo: File; mensaje: string };

type ExportarInput = Omit<Extract<MensajeEntrada, { type: "exportar" }>, "type">;

/**
 * Lee el Informe Diferido en un Web Worker para no bloquear la página y
 * conserva el resultado allí para exportarlo luego a Excel.
 */
export function useInformeDiferido() {
  const workerRef = useRef<Worker | null>(null);
  const exportRef = useRef<{
    resolve: (b: ArrayBuffer) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const [state, setState] = useState<EstadoLectura>({ estado: "vacio" });

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    exportRef.current?.reject(new Error("Se canceló la exportación."));
    exportRef.current = null;
  }, []);

  useEffect(() => terminate, [terminate]);

  const leer = useCallback(
    (archivo: File) => {
      terminate();
      const worker = new Worker(
        new URL("../../lib/comisiones/informe-diferido.worker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current = worker;
      setState({
        estado: "leyendo",
        archivo,
        progreso: { fase: "abriendo", fraccion: 0, lineas: 0 },
      });

      worker.onmessage = (e: MessageEvent<MensajeSalida>) => {
        const msg = e.data;
        if (msg.type === "progreso") {
          setState((s) =>
            s.estado === "leyendo" ? { ...s, progreso: msg.progreso } : s,
          );
        } else if (msg.type === "resultado") {
          setState({ estado: "listo", resultado: msg.resultado });
        } else if (msg.type === "exportado") {
          exportRef.current?.resolve(msg.buffer);
          exportRef.current = null;
        } else if (msg.type === "error") {
          if (exportRef.current) {
            exportRef.current.reject(new Error(msg.mensaje));
            exportRef.current = null;
          } else {
            setState({ estado: "error", archivo, mensaje: msg.mensaje });
          }
        }
      };
      worker.onerror = (e) => {
        setState({
          estado: "error",
          archivo,
          mensaje: e.message || "El navegador no pudo procesar el archivo.",
        });
      };

      worker.postMessage({ type: "leer", file: archivo } satisfies MensajeEntrada);
    },
    [terminate],
  );

  const limpiar = useCallback(() => {
    terminate();
    setState({ estado: "vacio" });
  }, [terminate]);

  const exportar = useCallback((input: ExportarInput) => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error("No hay un informe cargado."));
    return new Promise<ArrayBuffer>((resolve, reject) => {
      exportRef.current = { resolve, reject };
      worker.postMessage({ type: "exportar", ...input } satisfies MensajeEntrada);
    });
  }, []);

  return { state, leer, limpiar, exportar };
}
