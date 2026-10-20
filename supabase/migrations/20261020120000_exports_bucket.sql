-- Bucket privado para los Excel generados por el portal
-- (p. ej. /api/export-bancos). Solo el servidor escribe con la service role
-- key y entrega signed URLs de 1 h; no se crean políticas para usuarios.
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;
