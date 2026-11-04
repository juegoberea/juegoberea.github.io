-- Panel de Berea · P1: tablas, reglas de acceso (RLS), registro de actividad y códigos de recuperación.
--
-- Regla general: todo bloqueado. Solo la autora, identificada por su id interno (no por el correo)
-- y con la sesión confirmada con el código de 6 números (aal2), puede leer y escribir.
-- El juego no usa nada de esto: lee solo el archivo publicado en Storage (P5).

create extension if not exists pgcrypto with schema extensions;

-- ---------- Parte privada: nunca accesible desde el navegador ----------

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table privado.config (
  id boolean primary key default true check (id),
  autora_id uuid not null
);
insert into privado.config (autora_id) values ('c8846839-8fed-4204-bf18-44338f330d87');

-- Códigos de recuperación: solo se guarda su huella (sha256), nunca el código.
create table privado.codigos_recuperacion (
  id bigint generated always as identity primary key,
  huella text not null unique,
  creado_en timestamptz not null default now(),
  usado_en timestamptz
);

-- Intentos fallidos con códigos de recuperación (para frenar a quien pruebe códigos al azar).
create table privado.intentos_recuperacion (
  cuando timestamptz not null default now()
);

-- ---------- ¿Quién llama? ----------

-- La autora, sin importar si ya puso el código de 6 números.
create or replace function public.es_autora_sin_codigo() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.uid() = (select autora_id from privado.config), false);
$$;

-- La autora con la sesión confirmada con el código de 6 números.
create or replace function public.es_autora() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.es_autora_sin_codigo() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

revoke all on function public.es_autora_sin_codigo() from public, anon;
revoke all on function public.es_autora() from public, anon;
grant execute on function public.es_autora_sin_codigo() to authenticated;
grant execute on function public.es_autora() to authenticated;

-- ---------- Banco de preguntas ----------

create type public.validacion as enum ('errores', 'advertencias', 'bien');

create table public.libros (
  id text primary key,
  titulo text not null,
  idioma text not null default 'es',
  total_capitulos int not null check (total_capitulos > 0)
);
insert into public.libros (id, titulo, idioma, total_capitulos)
values ('patriarcas-y-profetas', 'Patriarcas y Profetas', 'es', 73);

-- Un capítulo escrito. Los «sin escribir» no tienen fila.
-- Estado = validacion + comparación de huellas (ver panel/src/estados.ts).
create table public.capitulos (
  libro_id text not null references public.libros (id) on delete cascade,
  numero int not null check (numero > 0),
  titulo text not null default '',
  reflexion text not null default '',
  validacion public.validacion not null default 'errores',
  avisos jsonb not null default '[]',
  medicion jsonb,
  huella text not null default '',
  huella_publicada text,
  actualizado_en timestamptz not null default now(),
  primary key (libro_id, numero)
);

-- Las preguntas, como en el Excel. Un borrador puede tener datos incompletos o repetidos,
-- por eso la clave es el orden de la fila y no el N.º.
create table public.preguntas (
  libro_id text not null,
  capitulo int not null,
  orden int not null,
  numero int,
  ronda smallint check (ronda between 1 and 4),
  texto text not null default '',
  opcion_a text not null default '',
  opcion_b text not null default '',
  opcion_c text not null default '',
  correcta smallint check (correcta between 0 and 2),
  explicacion text not null default '',
  cita text not null default '',
  primary key (libro_id, capitulo, orden),
  foreign key (libro_id, capitulo) references public.capitulos (libro_id, numero) on delete cascade
);

-- Cada publicación. Las escribe solo la función del servidor que firma (P5).
create table public.versiones (
  numero int primary key,
  version_juego bigint not null unique, -- número interno que compara el juego: siempre crece
  publicada_en timestamptz not null default now(),
  capitulos jsonb not null default '[]',
  mensaje text not null default '',
  sha256 text not null,
  contenido jsonb not null,
  vuelve_a int references public.versiones (numero),
  retirada_en timestamptz
);

-- ---------- Registro de actividad: solo se agrega, nunca se cambia ni se borra ----------

create table public.registro (
  id bigint generated always as identity primary key,
  cuando timestamptz not null default now(),
  accion text not null check (accion ~ '^[a-z_]{2,40}$'),
  detalle text not null default '' check (length(detalle) <= 500),
  navegador text not null default '' check (length(navegador) <= 120),
  resultado text not null default 'hecho' check (resultado in ('hecho', 'rechazado'))
);

-- La fecha la pone el servidor, no el navegador.
create or replace function privado.registro_con_hora() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.cuando := now();
  return new;
end;
$$;
create trigger registro_con_hora before insert on public.registro
for each row execute function privado.registro_con_hora();

-- ---------- Reglas de acceso (RLS) ----------

alter table public.libros enable row level security;
alter table public.capitulos enable row level security;
alter table public.preguntas enable row level security;
alter table public.versiones enable row level security;
alter table public.registro enable row level security;

-- Sin cuenta (anon) no se toca nada; con cuenta, solo lo que permiten las reglas.
revoke all on public.libros, public.capitulos, public.preguntas, public.versiones, public.registro from anon;
revoke insert, update, delete, truncate on public.libros, public.versiones from authenticated;
revoke update, delete, truncate on public.registro from authenticated;

create policy autora_lee_libros on public.libros for select to authenticated using (public.es_autora());

create policy autora_lee_capitulos on public.capitulos for select to authenticated using (public.es_autora());
create policy autora_agrega_capitulos on public.capitulos for insert to authenticated with check (public.es_autora());
create policy autora_cambia_capitulos on public.capitulos for update to authenticated using (public.es_autora()) with check (public.es_autora());
create policy autora_borra_capitulos on public.capitulos for delete to authenticated using (public.es_autora());

create policy autora_lee_preguntas on public.preguntas for select to authenticated using (public.es_autora());
create policy autora_agrega_preguntas on public.preguntas for insert to authenticated with check (public.es_autora());
create policy autora_cambia_preguntas on public.preguntas for update to authenticated using (public.es_autora()) with check (public.es_autora());
create policy autora_borra_preguntas on public.preguntas for delete to authenticated using (public.es_autora());

create policy autora_lee_versiones on public.versiones for select to authenticated using (public.es_autora());

create policy autora_lee_registro on public.registro for select to authenticated using (public.es_autora());
create policy autora_agrega_registro on public.registro for insert to authenticated with check (public.es_autora());

-- ---------- Códigos de recuperación ----------

-- Letras y números sin confusiones (sin 0/O, 1/I).
create or replace function privado.codigo_al_azar() returns text
language plpgsql volatile set search_path = '' as $$
declare
  letras constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea := extensions.gen_random_bytes(10);
  codigo text := '';
begin
  for i in 0..9 loop
    codigo := codigo || substr(letras, (get_byte(bytes, i) % 32) + 1, 1);
    if i = 4 then codigo := codigo || '-'; end if;
  end loop;
  return codigo;
end;
$$;

create or replace function privado.huella_codigo(codigo text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(upper(regexp_replace(codigo, '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
$$;

-- Cuántos códigos sin usar quedan (para saber si hay que crear los primeros).
create or replace function public.codigos_recuperacion_sin_usar() returns int
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return (select count(*) from privado.codigos_recuperacion where usado_en is null);
end;
$$;

-- Crea 10 códigos y los devuelve UNA sola vez. Solo si no quedan códigos sin usar:
-- volver a verlos o cambiarlos pedirá el sello de la autora (P6).
create or replace function public.crear_codigos_recuperacion() returns text[]
language plpgsql volatile security definer set search_path = '' as $$
declare
  codigos text[] := '{}';
  codigo text;
begin
  if not public.es_autora() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if exists (select 1 from privado.codigos_recuperacion where usado_en is null) then
    raise exception 'Ya hay códigos de recuperación sin usar' using errcode = 'P0001';
  end if;
  delete from privado.codigos_recuperacion;
  while coalesce(array_length(codigos, 1), 0) < 10 loop
    codigo := privado.codigo_al_azar();
    if not codigo = any (codigos) then
      codigos := codigos || codigo;
      insert into privado.codigos_recuperacion (huella) values (privado.huella_codigo(codigo));
    end if;
  end loop;
  insert into public.registro (accion, detalle) values ('codigos_creados', '10 códigos de recuperación');
  return codigos;
end;
$$;

-- Con la contraseña ya puesta (aal1) y un código del sobre: borra el código de 6 números
-- anterior para activar uno nuevo. Máximo 5 intentos fallidos por hora.
-- Devuelve 'bien', 'incorrecto' o 'bloqueado'.
create or replace function public.usar_codigo_recuperacion(codigo text) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  usado bigint;
begin
  if not public.es_autora_sin_codigo() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if (select count(*) from privado.intentos_recuperacion where cuando > now() - interval '1 hour') >= 5 then
    insert into public.registro (accion, detalle, resultado) values ('codigo_recuperacion', 'Demasiados intentos en una hora', 'rechazado');
    return 'bloqueado';
  end if;
  update privado.codigos_recuperacion set usado_en = now()
  where huella = privado.huella_codigo(codigo) and usado_en is null
  returning id into usado;
  if usado is null then
    insert into privado.intentos_recuperacion default values;
    insert into public.registro (accion, detalle, resultado) values ('codigo_recuperacion', 'Código incorrecto', 'rechazado');
    return 'incorrecto';
  end if;
  delete from auth.mfa_factors where user_id = auth.uid();
  insert into public.registro (accion, detalle) values ('codigo_recuperacion', 'Se usó un código de recuperación; hay que activar el código de 6 números otra vez');
  return 'bien';
end;
$$;

revoke all on function public.codigos_recuperacion_sin_usar() from public, anon;
revoke all on function public.crear_codigos_recuperacion() from public, anon;
revoke all on function public.usar_codigo_recuperacion(text) from public, anon;
grant execute on function public.codigos_recuperacion_sin_usar() to authenticated;
grant execute on function public.crear_codigos_recuperacion() to authenticated;
grant execute on function public.usar_codigo_recuperacion(text) to authenticated;
