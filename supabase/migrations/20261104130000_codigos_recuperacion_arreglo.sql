-- Arreglo: desde el panel, Supabase no permite DELETE sin WHERE (pg-safeupdate).
-- crear_codigos_recuperacion borraba los códigos viejos así y fallaba.

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
  delete from privado.codigos_recuperacion where usado_en is not null;
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
