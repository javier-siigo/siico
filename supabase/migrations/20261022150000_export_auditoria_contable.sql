-- Exportación de auditoría contable (todos los documentos, por tipo de cuenta).
--
-- 1. Tabla "ter" (Tercero) en el catálogo: campos calculados en la app desde
--    cliente / proveedor / empleado de la línea (NIT y nombre).
-- 2. Campos nuevos: creado por, moneda (nombre), montos en moneda del
--    documento y subsidiaria.
-- 3. Plantilla "Auditoría · Documentos contables" con las columnas que pide
--    contabilidad, filtrada por tipo de cuenta y subsidiarias en pesos.

alter table public.netsuite_campos drop constraint netsuite_campos_tabla_check;
alter table public.netsuite_campos
  add constraint netsuite_campos_tabla_check check (tabla = any (array['t', 'tl', 'tal', 'a', 'ter']));

insert into public.netsuite_campos (tabla, campo, modo, etiqueta, tipo, orden) values
  ('t',   'currency',            'texto', 'Moneda (Nombre)',            'text',   29),
  ('t',   'createdby',           'texto', 'Creado Por',                 'text',   30),
  ('tl',  'subsidiary',          'texto', 'Subsidiaria',                'text',   31),
  ('tl',  'debitforeignamount',  'valor', 'Débito Moneda Documento',    'number', 32),
  ('tl',  'creditforeignamount', 'valor', 'Crédito Moneda Documento',   'number', 33),
  ('ter', 'nombre',              'valor', 'Nombre Tercero',             'text',   34),
  ('ter', 'documento',           'valor', 'NIT/CC',                     'text',   35)
on conflict (tabla, campo, modo) do nothing;

insert into public.export_bancos_plantillas (nombre, campos, filtros, created_by, updated_by)
select
  'Auditoría · Documentos contables',
  array(
    select c.id
    from unnest(array[
      't.id:valor', 't.type:texto', 't.tranid:valor', 't.memo:valor', 'tl.memo:valor',
      'a.accountsearchdisplaynamecopy:valor', 't.trandate:valor', 't.currency:texto',
      't.createdby:texto', 'tl.debitforeignamount:valor', 'tl.creditforeignamount:valor',
      'tal.debit:valor', 'tal.credit:valor', 'ter.nombre:valor', 'ter.documento:valor',
      'tl.entity:texto'
    ]) with ordinality as k(clave, pos)
    join public.netsuite_campos c on c.tabla || '.' || c.campo || ':' || c.modo = k.clave
    order by k.pos
  ),
  jsonb_build_array(
    jsonb_build_object(
      'campoId', (select id from public.netsuite_campos where tabla = 'a' and campo = 'accttype' and modo = 'valor'),
      'tipo', 'lista', 'modo', 'incluir',
      'valores', jsonb_build_array(jsonb_build_object('v', 'AcctRec', 'l', 'Cuentas por cobrar'))
    ),
    jsonb_build_object(
      'campoId', (select id from public.netsuite_campos where tabla = 'tl' and campo = 'subsidiary' and modo = 'texto'),
      'tipo', 'lista', 'modo', 'incluir',
      'valores', jsonb_build_array(
        jsonb_build_object('v', '3',  'l', 'SIIGO S.A.S'),
        jsonb_build_object('v', '20', 'l', 'ASPEL COLOMBIA SAS'),
        jsonb_build_object('v', '22', 'l', 'EDITORA ACTUALICESE.COM S.A.S.'),
        jsonb_build_object('v', '23', 'l', 'PORTAL ACTUALICESE.COM S.A.S'),
        jsonb_build_object('v', '1',  'l', 'Empresa principal'),
        jsonb_build_object('v', '2',  'l', 'SIIGO HOLDING ELIMINATION'),
        jsonb_build_object('v', '10', 'l', 'SIIGO S.A.S ELIMINACION')
      )
    )
  ),
  null,
  null
where not exists (
  select 1 from public.export_bancos_plantillas where nombre = 'Auditoría · Documentos contables'
);
