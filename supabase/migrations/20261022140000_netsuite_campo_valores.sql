-- Caché de valores posibles por campo del catálogo para los filtros de lista
-- de la exportación de bancos. Se recalcula desde NetSuite cada 7 días.
-- Solo el servidor (service role) lee y escribe: RLS sin políticas.

create table public.netsuite_campo_valores (
  campo_id uuid primary key references public.netsuite_campos (id) on delete cascade,
  valores jsonb not null default '[]'::jsonb check (jsonb_typeof(valores) = 'array'),
  distintos integer not null default 0,
  truncado boolean not null default false,
  dias_sin_datos integer not null default 0,
  desde date not null,
  hasta date not null,
  actualizado_at timestamptz not null default now()
);

alter table public.netsuite_campo_valores enable row level security;
