import { ROLE_CONCILIACIONES, ROLE_INGRESOS } from "@/lib/auth/roles-shared";

/**
 * Documentos de `docs/procesos/` que se publican en /documentacion.
 * Sin dependencias de servidor: lo usan el menú (cliente) y las páginas.
 */
export interface DocumentoMeta {
  slug: string;
  /** Archivo dentro de `docs/procesos/`. */
  archivo: string;
  /** Nombre corto para el menú y la navegación Anterior/Siguiente. */
  titulo: string;
  descripcion: string;
  /** Roles que pueden leerlo (además de admin). Vacío: cualquier usuario autenticado. */
  roles: readonly string[];
}

export const DOCUMENTOS: readonly DocumentoMeta[] = [
  {
    slug: "arquitectura-general",
    archivo: "00-arquitectura-general.md",
    titulo: "Arquitectura general",
    descripcion: "Stack, estructura del repositorio, mapa de procesos y patrones comunes del portal.",
    roles: [],
  },
  {
    slug: "autenticacion-y-roles",
    archivo: "01-autenticacion-y-roles.md",
    titulo: "Autenticación y roles",
    descripcion: "Inicio de sesión, protección de rutas, roles y administración de usuarios.",
    roles: [],
  },
  {
    slug: "conciliaciones",
    archivo: "02-conciliaciones.md",
    titulo: "Conciliaciones bancarias",
    descripcion: "Conciliación por país y banco: flujo, contrato con n8n, datos y errores.",
    roles: [ROLE_CONCILIACIONES],
  },
  {
    slug: "notas-credito",
    archivo: "03-notas-credito.md",
    titulo: "Notas crédito",
    descripcion: "Conciliación de notas crédito contra NetSuite y resaltado de diferencias.",
    roles: [ROLE_INGRESOS],
  },
  {
    slug: "calculo-comisiones",
    archivo: "04-calculo-comisiones.md",
    titulo: "Cálculo de comisiones",
    descripcion: "Reconocimiento del gasto por cohortes, asientos, controles y cierres.",
    roles: [ROLE_INGRESOS],
  },
  {
    slug: "gestion-anticipos",
    archivo: "05-gestion-anticipos.md",
    titulo: "Gestión de anticipos",
    descripcion: "Registro y legalización de anticipos y cruce con excolaboradores.",
    roles: [ROLE_INGRESOS],
  },
  {
    slug: "importacion-retirados",
    archivo: "06-importacion-retirados.md",
    titulo: "Importación de excolaboradores",
    descripcion: "Carga del reporte de retirados, reglas de importación y búsqueda manual.",
    roles: [ROLE_INGRESOS],
  },
];

export function findDocumento(slug: string): DocumentoMeta | undefined {
  return DOCUMENTOS.find((d) => d.slug === slug);
}

export function findDocumentoPorArchivo(archivo: string): DocumentoMeta | undefined {
  return DOCUMENTOS.find((d) => d.archivo === archivo);
}
