-- Cierra el RLS de anticipos_registros por rol.
--
-- Antes las políticas eran `to authenticated` con `using (true)`: cualquier
-- usuario con sesión (p. ej. solo `conciliaciones`) podía leer, modificar y
-- borrar anticipos de todo el equipo invocando las server actions directamente.
-- Las server actions ya validan `ingresos` o `admin` en la capa de aplicación
-- (src/lib/anticipos/actions.ts); esto es la defensa en profundidad.

alter table public.anticipos_registros enable row level security;

drop policy if exists anticipos_select_authenticated on public.anticipos_registros;
create policy anticipos_select_ingresos on public.anticipos_registros
  for select to authenticated
  using (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'));

drop policy if exists anticipos_insert_authenticated on public.anticipos_registros;
create policy anticipos_insert_ingresos on public.anticipos_registros
  for insert to authenticated
  with check (
    (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'))
    and created_by = auth.uid()
    and updated_by = auth.uid()
  );

drop policy if exists anticipos_update_authenticated on public.anticipos_registros;
create policy anticipos_update_ingresos on public.anticipos_registros
  for update to authenticated
  using (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'))
  with check (
    (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'))
    and updated_by = auth.uid()
  );

drop policy if exists anticipos_delete_authenticated on public.anticipos_registros;
create policy anticipos_delete_ingresos on public.anticipos_registros
  for delete to authenticated
  using (public.current_user_has_role('ingresos') or public.current_user_has_role('admin'));