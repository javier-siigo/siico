-- Fija `search_path` en las funciones que lo tenían mutable.
--
-- Aviso de seguridad de Supabase (lint 0011). El riesgo real solo aplica a
-- las SECURITY DEFINER, pero fijar el path en todas evita que una futura
-- conversión a SECURITY DEFINER herede el problema. Con `search_path = ''`
-- solo se resuelven referencias explícitamente cualificadas y las de
-- pg_catalog, que Postgres siempre busca primero.
--
-- Se usa ALTER FUNCTION ... SET en vez de CREATE OR REPLACE para no reescribir
-- a mano los cuerpos de las funciones de matching.

alter function public.set_updated_at() set search_path = '';
alter function public.normalize_colaborador_name(text) set search_path = '';
alter function public.normalize_colaborador_name_unsorted(text) set search_path = '';
alter function public.match_colaborador_retirado(text) set search_path = '';
alter function public.match_colaborador_retirado_batch(text[]) set search_path = '';
alter function public.comisiones_guardar_cierre(text, jsonb, jsonb) set search_path = '';