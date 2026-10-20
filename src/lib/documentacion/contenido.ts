import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import GithubSlugger from "github-slugger";

import type { DocumentoMeta } from "./registry";

/** Carpeta fuente. `next.config.ts` la incluye en el build (outputFileTracingIncludes). */
const DOCS_DIR = path.join(process.cwd(), "docs", "procesos");

/**
 * Secciones `##` que describen fallas de seguridad: solo las ve admin.
 * Se compara sin la numeración ("10. Hallazgos transversales" → "hallazgos transversales").
 */
function esSeccionRestringida(titulo: string): boolean {
  const t = titulo.toLowerCase();
  return t.startsWith("hallazgos") || t.startsWith("lo que no está en este repositorio");
}

export interface EntradaToc {
  nivel: 2 | 3;
  texto: string;
  id: string;
}

export interface DocumentoProcesado {
  meta: DocumentoMeta;
  /** Texto del `#` del archivo. */
  titulo: string;
  /** Markdown sin el `#` ni las secciones que el usuario no puede ver. */
  cuerpo: string;
  toc: EntradaToc[];
  /** Ids de todos los encabezados que quedan, para validar enlaces con ancla. */
  anclas: Set<string>;
  /** Ids de los `##` restringidos que se muestran (solo admin), para marcarlos. */
  restringidas: Set<string>;
}

const leerArchivo = cache(async (archivo: string) =>
  readFile(path.join(DOCS_DIR, archivo), "utf8"),
);

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/;

/** Texto visible de un encabezado, como lo deja rehype-slug (sin sintaxis inline). */
function textoPlano(md: string): string {
  return md
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

function sinNumeracion(texto: string): string {
  return texto.replace(/^\d+(\.\d+)*\.?\s+/, "");
}

/**
 * Recorre el markdown línea a línea (respetando bloques de código): quita el
 * `#`, elimina las secciones restringidas para quien no es admin y calcula los
 * ids con el mismo slugger que usa rehype-slug, en el mismo orden.
 */
function procesar(meta: DocumentoMeta, raw: string, esAdmin: boolean): DocumentoProcesado {
  const slugger = new GithubSlugger();
  const salida: string[] = [];
  const toc: EntradaToc[] = [];
  const anclas = new Set<string>();
  const restringidas = new Set<string>();
  let titulo = meta.titulo;
  let enFence = false;
  let omitiendo = false;
  let tituloTomado = false;

  for (const linea of raw.split(/\r?\n/)) {
    if (FENCE.test(linea)) {
      enFence = !enFence;
      if (!omitiendo) salida.push(linea);
      continue;
    }
    const h = enFence ? null : HEADING.exec(linea);
    if (h) {
      const nivel = h[1]!.length;
      const texto = textoPlano(h[2]!);
      if (nivel === 1 && !tituloTomado) {
        titulo = texto;
        tituloTomado = true;
        continue;
      }
      if (nivel <= 2) omitiendo = false;
      if (nivel === 2 && esSeccionRestringida(sinNumeracion(texto))) {
        if (!esAdmin) {
          omitiendo = true;
          continue;
        }
        const id = slugger.slug(texto);
        restringidas.add(id);
        anclas.add(id);
        toc.push({ nivel: 2, texto, id });
        salida.push(linea);
        continue;
      }
      if (!omitiendo) {
        const id = slugger.slug(texto);
        anclas.add(id);
        if (nivel === 2 || nivel === 3) toc.push({ nivel, texto, id });
      }
    }
    if (!omitiendo) salida.push(linea);
  }

  return { meta, titulo, cuerpo: salida.join("\n").trim(), toc, anclas, restringidas };
}

export async function cargarDocumento(
  meta: DocumentoMeta,
  esAdmin: boolean,
): Promise<DocumentoProcesado> {
  return procesar(meta, await leerArchivo(meta.archivo), esAdmin);
}

/**
 * Anclas visibles de cada documento que el usuario puede leer, por archivo.
 * Sirve para reescribir enlaces entre documentos y descartar los que apuntan a
 * algo que el usuario no ve (otro documento sin permiso o una sección restringida).
 */
export async function anclasPorArchivo(
  accesibles: readonly DocumentoMeta[],
  esAdmin: boolean,
): Promise<Map<string, { slug: string; anclas: Set<string> }>> {
  const docs = await Promise.all(accesibles.map((m) => cargarDocumento(m, esAdmin)));
  return new Map(docs.map((d) => [d.meta.archivo, { slug: d.meta.slug, anclas: d.anclas }]));
}

