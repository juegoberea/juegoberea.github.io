-- Panel de Berea · medidas de seguridad extra (2026-11-05).
--   1. Intentos fallidos de entrada: quedan en el registro y, con 5 en 15 minutos, el panel hace esperar.
--   2. Una sesión cerrada (al salir, al entrar en otro aparato o al cambiar la contraseña) deja de
--      servir enseguida, sin esperar a que venza su permiso.
--   3. Borrar un libro o todo el banco se hace 24 horas después y se puede cancelar.
--   4. Copia automática del banco cada día (se guardan las últimas 30) y antes de cada borrado.

create extension if not exists pg_cron;

-- ---------- 1. Intentos fallidos de entrada ----------

create table if not exists privado.intentos_entrada (
  cuando timestamptz not null default now(),
  tipo text not null check (tipo in ('contrasena', 'codigo'))
);

-- Segundos que faltan para poder volver a probar (0 = se puede).
create or replace function public.pausa_de_entrada() returns int
language plpgsql stable security definer set search_path = '' as $$
declare
  fallos int;
  ultimo timestamptz;
begin
  select count(*), max(cuando) into fallos, ultimo
  from privado.intentos_entrada where cuando > now() - interval '15 minutes';
  if fallos < 5 then return 0; end if;
  return greatest(0, ceil(extract(epoch from (ultimo + interval '15 minutes' - now()))))::int;
end;
$$;

-- La anota el panel cuando la contraseña o el código no son correctos. Tope de 100 por hora
-- para que nadie llene el registro a propósito. Devuelve la pausa que corresponde.
create or replace function public.anotar_entrada_fallida(p_tipo text, p_navegador text default '') returns int
language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_tipo not in ('contrasena', 'codigo') then raise exception 'Tipo desconocido' using errcode = '22023'; end if;
  if (select count(*) from privado.intentos_entrada where cuando > now() - interval '1 hour') < 100 then
    insert into privado.intentos_entrada (tipo) values (p_tipo);
    insert into public.registro (accion, detalle, navegador, resultado) values (
      case p_tipo when 'contrasena' then 'entrada_fallida' else 'codigo_fallido' end,
      case p_tipo when 'contrasena' then 'Usuario o contraseña equivocados' else 'Código de 6 números equivocado' end,
      left(coalesce(p_navegador, ''), 120),
      'rechazado'
    );
  end if;
  return public.pausa_de_entrada();
end;
$$;

revoke all on function public.pausa_de_entrada() from public;
revoke all on function public.anotar_entrada_fallida(text, text) from public;
grant execute on function public.pausa_de_entrada() to anon, authenticated;
grant execute on function public.anotar_entrada_fallida(text, text) to anon, authenticated;

-- ---------- 2. Sesiones cerradas que dejan de servir enseguida ----------

-- Además del código de 6 números, la sesión tiene que seguir abierta en el servidor.
create or replace function public.es_autora() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.es_autora_sin_codigo()
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and exists (select 1 from auth.sessions s where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid);
$$;

-- ---------- 3. Borrados con 24 horas de espera ----------

create table if not exists privado.borrados_pendientes (
  id bigint generated always as identity primary key,
  accion text not null check (accion in ('borrar_libro', 'borrar_banco')),
  pedido_en timestamptz not null default now(),
  ejecutar_en timestamptz not null default now() + interval '24 hours'
);

-- La llama la función del servidor, después de comprobar el sello.
create or replace function public.servidor_programar_borrado(p_accion text) returns timestamptz
language plpgsql volatile security definer set search_path = '' as $$
declare
  cuando timestamptz;
begin
  delete from privado.borrados_pendientes where true;
  insert into privado.borrados_pendientes (accion) values (p_accion) returning ejecutar_en into cuando;
  return cuando;
end;
$$;
revoke all on function public.servidor_programar_borrado(text) from public, anon, authenticated;
grant execute on function public.servidor_programar_borrado(text) to service_role;

create or replace function public.borrado_pendiente() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return (select jsonb_build_object('accion', accion, 'ejecutar_en', ejecutar_en)
          from privado.borrados_pendientes order by id desc limit 1);
end;
$$;

-- Cancelar no pide el sello: deja todo como estaba.
create or replace function public.cancelar_borrado() returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if not exists (select 1 from privado.borrados_pendientes) then return false; end if;
  delete from privado.borrados_pendientes where true;
  insert into public.registro (accion, detalle) values ('borrado_cancelado', 'Se canceló el borrado programado. No se borró nada.');
  return true;
end;
$$;

revoke all on function public.borrado_pendiente() from public, anon;
revoke all on function public.cancelar_borrado() from public, anon;
grant execute on function public.borrado_pendiente() to authenticated;
grant execute on function public.cancelar_borrado() to authenticated;

-- ---------- 4. Copias del banco ----------

create table if not exists privado.copias (
  id bigint generated always as identity primary key,
  creada_en timestamptz not null default now(),
  motivo text not null default 'diaria',
  capitulos int not null,
  datos jsonb not null
);

create or replace function privado.copiar_banco(p_motivo text default 'diaria') returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  insert into privado.copias (motivo, capitulos, datos)
  select p_motivo,
         (select count(*) from public.capitulos),
         jsonb_build_object(
           'capitulos', (select coalesce(jsonb_agg(to_jsonb(c) order by c.libro_id, c.numero), '[]') from public.capitulos c),
           'preguntas', (select coalesce(jsonb_agg(to_jsonb(p) order by p.libro_id, p.capitulo, p.orden), '[]') from public.preguntas p)
         );
  delete from privado.copias where id not in (select id from privado.copias order by id desc limit 30);
end;
$$;

create or replace function public.ultima_copia() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return (select jsonb_build_object('creada_en', creada_en, 'capitulos', capitulos, 'guardadas', (select count(*) from privado.copias))
          from privado.copias order by id desc limit 1);
end;
$$;
revoke all on function public.ultima_copia() from public, anon;
grant execute on function public.ultima_copia() to authenticated;

-- Hace los borrados que ya cumplieron sus 24 horas (con una copia justo antes).
create or replace function privado.hacer_borrados() returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  b record;
begin
  for b in select * from privado.borrados_pendientes where ejecutar_en <= now() order by id loop
    perform privado.copiar_banco('antes de ' || replace(b.accion, '_', ' '));
    if b.accion = 'borrar_banco' then
      delete from public.capitulos where true;
    else
      delete from public.capitulos where libro_id = 'patriarcas-y-profetas';
    end if;
    delete from privado.borrados_pendientes where id = b.id;
    insert into public.registro (accion, detalle) values ('borrado_hecho',
      case b.accion when 'borrar_banco' then 'Se borró todo el banco (pedido hace 24 horas). Hay una copia de antes.'
                    else 'Se borró Patriarcas y Profetas del banco (pedido hace 24 horas). Hay una copia de antes.' end);
  end loop;
end;
$$;

-- Tareas automáticas (cron.schedule con el mismo nombre reemplaza la anterior).
select cron.schedule('berea-borrados', '*/10 * * * *', 'select privado.hacer_borrados()');
select cron.schedule('berea-copia-diaria', '0 7 * * *', 'select privado.copiar_banco()');
