-- Endurece `current_user_has_role`:
--   - ya no la puede ejecutar el rol `anon` vía POST /rest/v1/rpc/... (no la
--     necesitan: sin sesión auth.uid() es NULL y siempre devuelve false);
--   - fija `search_path` para que no dependa del search_path del que llama;
--   - la mantiene siendo SECURITY DEFINER porque las políticas de RLS la usan
--     para leer `user_roles`, a la que los usuarios no tienen acceso directo.

-- Ojo: `revoke ... from anon` no basta si el ACL tiene `=X/postgres`
-- (EXECUTE para PUBLIC). Hay que revocar también de `public` y después
-- re-grantear solo a `authenticated`.
revoke execute on function public.current_user_has_role(text) from anon;
revoke execute on function public.current_user_has_role(text) from public;

create or replace function public.current_user_has_role(check_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and check_role = any(roles)
  );
$$;

grant execute on function public.current_user_has_role(text) to authenticated;