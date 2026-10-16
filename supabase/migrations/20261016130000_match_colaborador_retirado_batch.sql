-- match_colaborador_retirado_batch
-- Variante batch de match_colaborador_retirado: recibe un array de nombres y
-- devuelve, para cada input, el mejor candidato de colaboradores_retirados
-- según las mismas reglas (exacto > exacto_inverso > parcial con menos extras).
--
-- El "mejor candidato" se elige con row_number() sobre la partición por
-- nombre consultado, así la página web sólo necesita un round-trip y puede
-- cruzar N anticipos contra los 373 retirad en una sola consulta.

CREATE OR REPLACE FUNCTION public.match_colaborador_retirado_batch(p_inputs text[])
RETURNS TABLE (
  query text,
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
  with inputs as (
    select q.input as query,
           string_to_array(
             public.normalize_colaborador_name_unsorted(q.input),
             ' '
           ) as toks
    from unnest(p_inputs) as q(input)
    where length(trim(q.input)) > 0
  ),
  scored as (
    select
      i.query,
      r.cedula,
      r.nombre,
      r.valor,
      r.observacion,
      r.fecha_reporte,
      string_to_array(
        public.normalize_colaborador_name_unsorted(r.nombre),
        ' '
      ) as r_toks,
      i.toks as i_toks,
      case
        when string_to_array(
          public.normalize_colaborador_name_unsorted(r.nombre),
          ' '
        ) = i.toks then 'exacto'
        when string_to_array(
          public.normalize_colaborador_name_unsorted(r.nombre),
          ' '
        ) = (
          select array_agg(t.token::text order by t.ord desc)
          from unnest(i.toks) with ordinality as t(token, ord)
        ) then 'exacto_inverso'
        else 'parcial'
      end as lvl
    from inputs i
    cross join public.colaboradores_retirados r
  ),
  filtered as (
    select
      s.query,
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
      ) as extras,
      array_length(
        array(
          select unnest(s.r_toks)
          except
          select unnest(s.i_toks)
        ),
        1
      ) as extras_len
    from scored s
    where s.r_toks @> s.i_toks
  ),
  ranked as (
    select
      f.*,
      row_number() over (
        partition by f.query
        order by
          case f.lvl
            when 'exacto' then 0
            when 'exacto_inverso' then 1
            else 2
          end,
          f.extras_len,
          f.cedula
      ) as rn
    from filtered f
  )
  select
    r.query,
    r.cedula,
    r.nombre,
    r.valor,
    r.observacion,
    r.fecha_reporte,
    r.lvl,
    r.comunes,
    r.extras
  from ranked r
  where r.rn = 1;
$function$;
