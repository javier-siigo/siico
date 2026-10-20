-- Campos configurables de la exportación de movimientos bancarios (NetSuite)
--
-- netsuite_campos            catálogo curado de campos que se pueden pedir a
--                            SuiteQL. Solo admin lo edita; la API arma el
--                            SELECT únicamente con filas de esta tabla.
-- export_bancos_plantillas   selecciones de campos con nombre, compartidas por
--                            el equipo de ingresos.

create table if not exists public.netsuite_campos (
  id uuid primary key default gen_random_uuid(),
  -- Alias de la tabla en la query: t = transaction, tl = transactionline,
  -- tal = transactionaccountingline, a = account.
  tabla text not null check (tabla in ('t', 'tl', 'tal', 'a')),
  -- Se interpola en el SQL: solo identificadores simples.
  campo text not null check (campo ~ '^[a-z][a-z0-9_]{0,99}$'),
  -- valor = el campo tal cual; texto = BUILTIN.DF(campo) (nombre visible).
  modo text not null default 'valor' check (modo in ('valor', 'texto')),
  etiqueta text not null check (char_length(btrim(etiqueta)) between 1 and 80),
  tipo text not null default 'text'
    check (tipo in ('text', 'number', 'date', 'datetime', 'boolean')),
  habilitado boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id),
  updated_at timestamptz not null default now(),
  constraint netsuite_campos_texto_es_text check (modo = 'valor' or tipo = 'text'),
  constraint netsuite_campos_key unique (tabla, campo, modo)
);

create table if not exists public.export_bancos_plantillas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(btrim(nombre)) between 2 and 80),
  campos uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid() references auth.users (id)
);

create unique index if not exists export_bancos_plantillas_nombre_key
  on public.export_bancos_plantillas (lower(btrim(nombre)));

alter table public.netsuite_campos enable row level security;
alter table public.export_bancos_plantillas enable row level security;

drop policy if exists netsuite_campos_ingresos_select on public.netsuite_campos;
create policy netsuite_campos_ingresos_select on public.netsuite_campos
  for select to authenticated
  using (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'));

drop policy if exists netsuite_campos_admin_write on public.netsuite_campos;
create policy netsuite_campos_admin_write on public.netsuite_campos
  for all to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

drop policy if exists export_bancos_plantillas_ingresos_all on public.export_bancos_plantillas;
create policy export_bancos_plantillas_ingresos_all on public.export_bancos_plantillas
  for all to authenticated
  using (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'))
  with check (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'));

-- Catálogo inicial: los 28 campos de la exportación original.
insert into public.netsuite_campos (tabla, campo, modo, etiqueta, tipo, orden) values
  ('t',   'id',                           'valor', 'ID Transacción',            'text',     1),
  ('t',   'tranid',                       'valor', 'Número Documento',          'text',     2),
  ('t',   'trandate',                     'valor', 'Fecha',                     'date',     3),
  ('t',   'postingperiod',                'valor', 'Periodo Contable',          'text',     4),
  ('t',   'type',                         'valor', 'Código Tipo',               'text',     5),
  ('t',   'type',                         'texto', 'Tipo Documento',            'text',     6),
  ('t',   'status',                       'valor', 'Estado',                    'text',     7),
  ('t',   'memo',                         'valor', 'Nota Principal',            'text',     8),
  ('t',   'currency',                     'valor', 'Moneda',                    'text',     9),
  ('t',   'exchangerate',                 'valor', 'Tasa de Cambio',            'number',  10),
  ('t',   'createddate',                  'valor', 'Fecha Creación',            'datetime',11),
  ('t',   'lastmodifieddate',             'valor', 'Fecha Última Modificación', 'datetime',12),
  ('tl',  'id',                           'valor', 'Línea',                     'text',    13),
  ('tl',  'memo',                         'valor', 'Nota Línea',                'text',    14),
  ('tl',  'entity',                       'valor', 'ID Tercero',                'text',    15),
  ('tl',  'entity',                       'texto', 'Tercero',                   'text',    16),
  ('tl',  'department',                   'valor', 'ID Centro de Costo',        'text',    17),
  ('tl',  'department',                   'texto', 'Centro de Costo',           'text',    18),
  ('tl',  'class',                        'valor', 'Clase',                     'text',    19),
  ('tl',  'location',                     'valor', 'Ubicación',                 'text',    20),
  ('a',   'id',                           'valor', 'ID Cuenta',                 'text',    21),
  ('a',   'acctnumber',                   'valor', 'Número Cuenta',             'text',    22),
  ('a',   'accountsearchdisplaynamecopy', 'valor', 'Cuenta Contable',           'text',    23),
  ('a',   'accttype',                     'valor', 'Tipo Cuenta',               'text',    24),
  ('tal', 'debit',                        'valor', 'Débito',                    'number',  25),
  ('tal', 'credit',                       'valor', 'Crédito',                   'number',  26),
  ('tal', 'amount',                       'valor', 'Monto',                     'number',  27),
  ('tal', 'netamount',                    'valor', 'Monto Neto',                'number',  28)
on conflict (tabla, campo, modo) do nothing;

insert into public.export_bancos_plantillas (nombre, campos)
select 'Bancos estándar', array_agg(id order by orden)
from public.netsuite_campos
where not exists (
  select 1 from public.export_bancos_plantillas where lower(btrim(nombre)) = 'bancos estándar'
);
