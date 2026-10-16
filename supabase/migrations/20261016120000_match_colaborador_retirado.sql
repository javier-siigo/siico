-- match_colaborador_retirado
-- Devuelve candidatos de colaboradores_retirados que coincidan con un nombre
-- libre, aceptando tanto el orden "nombre apellido" como "apellido nombre"
-- y exponiendo los tokens extra (segundo nombre / segundo apellido) para que
-- el caller pueda desambiguar empates parciales.
--
-- No modifica la función normalize_colaborador_name existente ni las columnas
-- GENERATED nombre_normalizado: introduce una variante unsorted que preserva
-- el orden de los tokens.

CREATE OR REPLACE FUNCTION public.normalize_colaborador_name_unsorted(n text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $function$
  select string_agg(t.token, ' ')
  from (
    select unnest(regexp_split_to_array(
      lower(translate(
        regexp_replace(coalesce(n, ''), '[^[:alnum:] ]', ' ', 'g'),
        'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'
      )),
      '\s+'
    )) as token
  ) t
  where t.token <> ''
$function$;

CREATE OR REPLACE FUNCTION public.match_colaborador_retirado(p_input text)
RETURNS TABLE (
  cedula numeric,
  nombre text,
  valor numeric,
  observacion text,
  fecha_reporte date,
  nivel text,
  tokens_comunes text[],
  tokens_extra text[]
)
LANGUAGE sql
STABLE
AS $function$
  with input as (
    select string_to_array(
      public.normalize_colaborador_name_unsorted(p_input),
      ' '
    ) as toks
  ),
  scored as (
    select
      r.cedula,
      r.nombre,
      r.valor,
      r.observacion,
      r.fecha_reporte,
      string_to_array(
        public.normalize_colaborador_name_unsorted(r.nombre),
        ' '
      ) as r_toks,
      (select toks from input) as i_toks,
      case
        when string_to_array(
          public.normalize_colaborador_name_unsorted(r.nombre),
          ' '
        ) = (select toks from input) then 'exacto'
        when string_to_array(
          public.normalize_colaborador_name_unsorted(r.nombre),
          ' '
        ) = (
          select array_agg(t.token::text order by t.ord desc)
          from unnest((select toks from input)) with ordinality as t(token, ord)
        ) then 'exacto_inverso'
        else 'parcial'
      end as lvl
    from public.colaboradores_retirados r
    where (select array_length(toks, 1) from input) >= 1
  )
  select
    s.cedula,
    s.nombre,
    s.valor,
    s.observacion,
    s.fecha_reporte,
    s.lvl,
    array(
      select unnest(s.i_toks)
      intersect
      select unnest(s.r_toks)
    ) as comunes,
    array(
      select unnest(s.r_toks)
      except
      select unnest(s.i_toks)
    ) as extras
  from scored s
  where s.r_toks @> s.i_toks
  order by
    case s.lvl
      when 'exacto' then 0
      when 'exacto_inverso' then 1
      else 2
    end,
    array_length(
      array(
        select unnest(s.r_toks)
        except
        select unnest(s.i_toks)
      ),
      1
    ),
    s.cedula;
$function$;
