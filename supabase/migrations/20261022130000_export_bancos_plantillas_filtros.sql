-- Las plantillas de la exportación de bancos guardan también los filtros
-- (lista de valores, texto, rango, vacío/con valor) además de las columnas.
-- La forma la valida la app (`src/lib/netsuite/filtros.ts`); aquí solo se
-- exige que sea un arreglo JSON.

alter table public.export_bancos_plantillas
  add column if not exists filtros jsonb not null default '[]'::jsonb;

alter table public.export_bancos_plantillas
  drop constraint if exists export_bancos_plantillas_filtros_array;
alter table public.export_bancos_plantillas
  add constraint export_bancos_plantillas_filtros_array
  check (jsonb_typeof(filtros) = 'array');
