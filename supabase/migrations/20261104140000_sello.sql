-- Panel de Berea · P6: el sello de la autora para las acciones muy delicadas.
-- Cada acción pide un desafío nuevo (vence a los 5 minutos y sirve una sola vez) firmado con
-- el sello: un par de claves Ed25519 distinto de la llave que firma el contenido. La parte
-- privada vive en el pendrive de la autora; aquí solo se guarda la pública.

alter table privado.config add column if not exists sello_publico text;

create table if not exists privado.desafios (
  id uuid primary key default gen_random_uuid(),
  accion text not null,
  creado_en timestamptz not null default now(),
  vence_en timestamptz not null default now() + interval '5 minutes',
  usado_en timestamptz
);

-- La autora (con el código de 6 números) pide un desafío para una acción.
create or replace function public.crear_desafio(accion text) returns json
language plpgsql volatile security definer set search_path = '' as $$
declare
  nuevo privado.desafios;
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if accion !~ '^[a-z_]{2,40}$' then raise exception 'Acción inválida' using errcode = '22023'; end if;
  delete from privado.desafios where vence_en < now() - interval '1 day';
  insert into privado.desafios (accion) values (accion) returning * into nuevo;
  return json_build_object('id', nuevo.id, 'vence_en', nuevo.vence_en);
end;
$$;

-- Solo el servidor: marca el desafío como usado y devuelve la clave pública del sello.
-- Falla si no existe, es de otra acción, ya se usó o venció.
create or replace function public.servidor_usar_desafio(p_id uuid, p_accion text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  usado uuid;
  publica text;
begin
  update privado.desafios set usado_en = now()
  where id = p_id and accion = p_accion and usado_en is null and vence_en > now()
  returning id into usado;
  if usado is null then raise exception 'Desafío vencido, usado o inexistente' using errcode = 'P0001'; end if;
  select sello_publico into publica from privado.config;
  if publica is null then raise exception 'El sello todavía no está configurado' using errcode = 'P0001'; end if;
  return publica;
end;
$$;

-- Solo el servidor (después de comprobar el sello): códigos de recuperación nuevos.
create or replace function public.servidor_nuevos_codigos() returns text[]
language plpgsql volatile security definer set search_path = '' as $$
declare
  codigos text[] := '{}';
  codigo text;
begin
  delete from privado.codigos_recuperacion where true;
  while coalesce(array_length(codigos, 1), 0) < 10 loop
    codigo := privado.codigo_al_azar();
    if not codigo = any (codigos) then
      codigos := codigos || codigo;
      insert into privado.codigos_recuperacion (huella) values (privado.huella_codigo(codigo));
    end if;
  end loop;
  return codigos;
end;
$$;

-- ¿Ya hay un sello configurado? (para la pantalla Seguridad)
create or replace function public.hay_sello() returns boolean
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return (select sello_publico is not null from privado.config);
end;
$$;

revoke all on function public.crear_desafio(text) from public, anon;
revoke all on function public.servidor_usar_desafio(uuid, text) from public, anon, authenticated;
revoke all on function public.servidor_nuevos_codigos() from public, anon, authenticated;
revoke all on function public.hay_sello() from public, anon;
grant execute on function public.crear_desafio(text) to authenticated;
grant execute on function public.servidor_usar_desafio(uuid, text) to service_role;
grant execute on function public.servidor_nuevos_codigos() to service_role;
grant execute on function public.hay_sello() to authenticated;

-- Depósito público del contenido publicado: cualquiera lo lee (el juego, sin cuenta);
-- solo el servidor escribe (no hay reglas de escritura para nadie más).
insert into storage.buckets (id, name, public) values ('contenido', 'contenido', true)
on conflict (id) do update set public = true;
