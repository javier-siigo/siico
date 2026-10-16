-- Reconocimiento del gasto de comisiones por cohortes
--
-- Reemplaza el cálculo de "pool global" por el proceso que lleva
-- contabilidad en "Reconocimiento gasto de comisiones":
--
--   cohorte   mes en que se causan las comisiones y se emiten las facturas.
--   % del mes ingreso F93+F94 de la cohorte reconocido en el mes
--             ÷ facturación neta F93+F94 de la cohorte (facturas − NC).
--   gasto     comisiones de la cohorte × % del mes.
--
-- comisiones_conceptos          + cuenta contable del gasto.
-- comisiones_periodo_valores    comisiones causadas por concepto (cohorte).
-- comisiones_bases              facturas y NC F93/F94 emitidas en el mes.
-- comisiones_reconocimientos    ingreso reconocido en un mes por cohorte y lo
--                               que queda por diferir, leído del Informe
--                               Diferido (o del Excel histórico).
-- comisiones_gasto_registrado   gasto contabilizado a mano que difiere de la
--                               fórmula; manda sobre el cálculo.
-- comisiones_cierres            asientos generados y guardados por mes.
--
-- Cierre de cohortes: nunca se lleva al gasto más de lo causado (el último
-- mes toma solo el saldo) y, cuando las facturas de la cohorte ya no tienen
-- ingreso por diferir, el saldo se amortiza como ajuste de cierre.

alter table public.comisiones_conceptos
  add column if not exists cuenta text
    check (cuenta is null or cuenta ~ '^\d{4,12}$');

-- Permite cargar el histórico desde migraciones (sin usuario en sesión).
alter table public.comisiones_conceptos alter column created_by drop not null;
alter table public.comisiones_periodo_valores alter column updated_by drop not null;

create table if not exists public.comisiones_bases (
  periodo text not null check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  prefijo text not null check (prefijo in ('F93', 'F94')),
  facturas numeric(18, 2) not null default 0,
  notas_credito numeric(18, 2) not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id),
  primary key (periodo, prefijo)
);

create table if not exists public.comisiones_reconocimientos (
  cohorte text not null check (cohorte ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  periodo text not null check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  prefijo text not null check (prefijo in ('F93', 'F94')),
  ingreso numeric(18, 2) not null,
  -- PENDIENTE_POR_DIFERIR de las facturas de la cohorte; null si se desconoce.
  pendiente_ingreso numeric(18, 2),
  fuente text not null default 'informe' check (fuente in ('informe', 'excel')),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id),
  primary key (cohorte, periodo, prefijo),
  check (cohorte <= periodo)
);

create index if not exists comisiones_reconocimientos_periodo_idx
  on public.comisiones_reconocimientos (periodo);

create table if not exists public.comisiones_gasto_registrado (
  cohorte text not null check (cohorte ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  periodo text not null check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  concepto_id uuid not null references public.comisiones_conceptos (id) on delete cascade,
  gasto numeric(18, 2) not null,
  motivo text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id),
  primary key (cohorte, periodo, concepto_id),
  check (cohorte <= periodo)
);

create table if not exists public.comisiones_cierres (
  id uuid primary key default gen_random_uuid(),
  periodo text not null unique check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  archivo_nombre text not null,
  archivo_tamano bigint not null,
  gasto_mes numeric(18, 2) not null,
  diferido_nuevo numeric(18, 2) not null,
  saldo_diferido numeric(18, 2) not null,
  asientos jsonb not null default '[]'::jsonb,
  controles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id)
);

-- El resumen de "pool global" ya no aplica.
drop table if exists public.comisiones_ejecuciones;

alter table public.comisiones_bases enable row level security;
alter table public.comisiones_reconocimientos enable row level security;
alter table public.comisiones_gasto_registrado enable row level security;
alter table public.comisiones_cierres enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'comisiones_bases',
    'comisiones_reconocimientos',
    'comisiones_gasto_registrado',
    'comisiones_cierres'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_ingresos_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.current_user_has_role(''ingresos'') or public.current_user_has_role(''admin''))
         with check (public.current_user_has_role(''ingresos'') or public.current_user_has_role(''admin''))',
      t || '_ingresos_all', t
    );
  end loop;
end $$;

-- Guarda el cierre de un mes de forma atómica: reemplaza el ingreso del mes
-- por el leído del informe y registra los asientos. Corre con los permisos
-- del usuario (RLS aplica).
create or replace function public.comisiones_guardar_cierre(
  p_periodo text,
  p_reconocimientos jsonb,
  p_cierre jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.comisiones_reconocimientos where periodo = p_periodo;

  insert into public.comisiones_reconocimientos
    (cohorte, periodo, prefijo, ingreso, pendiente_ingreso, fuente)
  select r.cohorte, p_periodo, r.prefijo, r.ingreso, r.pendiente_ingreso, 'informe'
  from jsonb_to_recordset(p_reconocimientos)
    as r(cohorte text, prefijo text, ingreso numeric, pendiente_ingreso numeric);

  insert into public.comisiones_cierres (
    periodo, archivo_nombre, archivo_tamano, gasto_mes, diferido_nuevo,
    saldo_diferido, asientos, controles
  ) values (
    p_periodo,
    p_cierre ->> 'archivoNombre',
    (p_cierre ->> 'archivoTamano')::bigint,
    (p_cierre ->> 'gastoMes')::numeric,
    (p_cierre ->> 'diferidoNuevo')::numeric,
    (p_cierre ->> 'saldoDiferido')::numeric,
    coalesce(p_cierre -> 'asientos', '[]'::jsonb),
    coalesce(p_cierre -> 'controles', '[]'::jsonb)
  )
  on conflict (periodo) do update set
    archivo_nombre = excluded.archivo_nombre,
    archivo_tamano = excluded.archivo_tamano,
    gasto_mes = excluded.gasto_mes,
    diferido_nuevo = excluded.diferido_nuevo,
    saldo_diferido = excluded.saldo_diferido,
    asientos = excluded.asientos,
    controles = excluded.controles,
    created_at = now(),
    created_by = auth.uid();
end;
$$;

grant execute on function public.comisiones_guardar_cierre(text, jsonb, jsonb) to authenticated;

-- Conceptos y cuentas del proceso actual.
insert into public.comisiones_conceptos (nombre, cuenta, orden) values
  ('Comisiones ventas', '52051801', 1),
  ('Incentivos', '52051802', 2),
  ('Bonificaciones ventas', '52054801', 3),
  ('Comisiones por ventas cruce', '52950502', 4)
on conflict ((lower(btrim(nombre)))) do update
  set cuenta = coalesce(public.comisiones_conceptos.cuenta, excluded.cuenta);
