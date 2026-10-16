-- Cálculo de comisiones
--
-- comisiones_conceptos          catálogo editable de conceptos (el contador
--                               puede crear, renombrar o desactivar).
-- comisiones_periodo_valores    dinero por concepto en cada periodo (YYYY-MM).
-- comisiones_ejecuciones        resumen guardado del cálculo de un periodo a
--                               partir del Informe Diferido (solo F93/F94).
--                               El detalle por factura no se persiste; se
--                               recalcula en el navegador y se exporta a Excel.

create table if not exists public.comisiones_conceptos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id),
  updated_at timestamptz not null default now()
);

create unique index if not exists comisiones_conceptos_nombre_key
  on public.comisiones_conceptos (lower(btrim(nombre)));

create table if not exists public.comisiones_periodo_valores (
  periodo text not null check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  concepto_id uuid not null references public.comisiones_conceptos (id) on delete cascade,
  valor numeric(18, 2) not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users (id),
  primary key (periodo, concepto_id)
);

create table if not exists public.comisiones_ejecuciones (
  id uuid primary key default gen_random_uuid(),
  periodo text not null unique check (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  archivo_nombre text not null,
  archivo_tamano bigint not null,
  facturas integer not null,
  lineas integer not null,
  total_facturado numeric(18, 2) not null,
  cuota_mes numeric(18, 2) not null,
  reconocido_acumulado numeric(18, 2) not null,
  pendiente_por_diferir numeric(18, 2) not null,
  pool_comisiones numeric(18, 2) not null,
  comision_mes numeric(18, 2) not null,
  -- Totales por prefijo (F93, F94) y snapshot de conceptos usados.
  por_prefijo jsonb not null default '[]'::jsonb,
  conceptos jsonb not null default '[]'::jsonb,
  controles jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id)
);

alter table public.comisiones_conceptos enable row level security;
alter table public.comisiones_periodo_valores enable row level security;
alter table public.comisiones_ejecuciones enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'comisiones_conceptos',
    'comisiones_periodo_valores',
    'comisiones_ejecuciones'
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
