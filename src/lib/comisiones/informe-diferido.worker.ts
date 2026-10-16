/// <reference lib="webworker" />

import { construirExcel, type ExportarOpciones } from "./exportar";
import { leerInformeDiferido, type ProgresoLectura } from "./informe-diferido";
import type { ResultadoArchivo } from "./types";

export type MensajeEntrada =
  | { type: "leer"; file: File }
  | ({ type: "exportar" } & ExportarOpciones);

export type MensajeSalida =
  | { type: "progreso"; progreso: ProgresoLectura }
  | { type: "resultado"; resultado: ResultadoArchivo }
  | { type: "exportado"; buffer: ArrayBuffer }
  | { type: "error"; mensaje: string };

declare const self: DedicatedWorkerGlobalScope;

let ultimo: ResultadoArchivo | null = null;

function post(msg: MensajeSalida, transfer: Transferable[] = []) {
  self.postMessage(msg, transfer);
}

async function exportar(msg: Extract<MensajeEntrada, { type: "exportar" }>) {
  if (!ultimo) throw new Error("No hay un informe cargado para exportar.");
  const buffer = await construirExcel(ultimo, msg);
  post({ type: "exportado", buffer }, [buffer]);
}

self.onmessage = async (e: MessageEvent<MensajeEntrada>) => {
  const msg = e.data;
  try {
    if (msg.type === "leer") {
      ultimo = null;
      const resultado = await leerInformeDiferido(msg.file, (progreso) =>
        post({ type: "progreso", progreso }),
      );
      ultimo = resultado;
      post({ type: "resultado", resultado });
    } else if (msg.type === "exportar") {
      await exportar(msg);
    }
  } catch (err) {
    post({
      type: "error",
      mensaje: err instanceof Error ? err.message : "Error inesperado al procesar el archivo.",
    });
  }
};
