-- Última actividad real por usuario (no solo el último inicio de sesión).
--   - Tabla aparte de `user_roles` para no crear filas de roles vacías.
--   - Sin políticas de RLS: nadie la lee ni escribe directo; solo el
--     service role (pantalla de admin) y la función de abajo.
--   - `touch_last_seen()` la llama el proxy con la sesión del usuario; escribe
--     como mucho una vez cada 5 minutos aunque se llame más seguido.

create table public.user_activity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_activity enable row level security;

create or replace function public.touch_last_seen()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into public.user_activity (user_id, last_seen_at)
  select auth.uid(), now()
  where auth.uid() is not null
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at
    where public.user_activity.last_seen_at < now() - interval '5 minutes';
$$;

revoke execute on function public.touch_last_seen() from public;
revoke execute on function public.touch_last_seen() from anon;
grant execute on function public.touch_last_seen() to authenticated;
