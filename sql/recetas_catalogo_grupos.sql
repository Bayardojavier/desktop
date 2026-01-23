-- Tabla simplificada para plantillas de recetas.
-- Copia datos clave del catálogo (Nombre Base, medidas, etc.) para agrupar materiales sin depender del catálogo completo.
-- Evita duplicación y permite control manual sobre qué se incluye en recetas.
-- Cubre los 3 catálogos: Hierros, Audiovisual, Consumibles.

-- Crear tabla si no existe
create table if not exists public.recetas_plantillas_materiales (
  id uuid primary key default gen_random_uuid(),
  nombre_plantilla text not null unique,  -- Ej: "Piso 60x244x5"
  tipo text not null check (tipo in ('MATERIAL', 'CONTENEDOR', 'CASE')),
  dimensiones jsonb,  -- Copia de dimensiones del catálogo
  catalogos text[] not null default array[]::text[],  -- Ej: ['HIERROS', 'AUDIOVISUAL']
  bodega_secundaria text[] not null default array[]::text[],  -- Bodegas secundarias
  descripcion text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Agregar columna bodega_secundaria si no existe (para compatibilidad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'recetas_plantillas_materiales'
    AND column_name = 'bodega_secundaria'
  ) THEN
    ALTER TABLE public.recetas_plantillas_materiales
    ADD COLUMN bodega_secundaria text[] DEFAULT array[]::text[];
    COMMENT ON COLUMN public.recetas_plantillas_materiales.bodega_secundaria IS 'Bodegas secundarias donde se puede encontrar esta plantilla/material';
  END IF;
END $$;

-- Trigger para copiar automáticamente al insertar en catalogo_hierros (solo MATERIAL)
create or replace function public.fn_copiar_plantilla_hierros()
returns trigger
language plpgsql
as $$
declare
  plantilla_nombre text;
  dims_sig text;
begin
  -- Solo para MATERIAL
  if new.tipo_alta = 'MATERIAL' and (new.es_contenedor is false or new.es_contenedor is null) then
    -- Calcular nombre de plantilla: nombre_base + dimensiones
    dims_sig := nullif(
      coalesce(
        nullif(concat_ws('x', nullif(new.dimensiones->>'ancho',''), nullif(new.dimensiones->>'largo',''), nullif(new.dimensiones->>'grosor','')), ''),
        nullif(concat_ws('x', nullif(new.dimensiones->>'diametro',''), nullif(new.dimensiones->>'largo','')), ''),
        nullif(concat_ws('x', nullif(new.dimensiones->>'alto',''), nullif(new.dimensiones->>'ancho',''), nullif(new.dimensiones->>'largo','')), '')
      ),
      ''
    );

    plantilla_nombre := trim(coalesce(new.nombre_base, regexp_replace(new.nombre, '\s+\d+\s*$', '')) || case when dims_sig is not null then ' ' || dims_sig else '' end);

    -- Insertar si no existe
    insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
    values (plantilla_nombre, 'MATERIAL', new.dimensiones, array['HIERROS'], case when new.bodega_secundaria is not null then array[new.bodega_secundaria] else array[]::text[] end, 'Auto-copiado de catálogo')
    on conflict (nombre_plantilla) do nothing;
  end if;

  return new;
end;
$$;

-- Trigger para copiar automáticamente al insertar en catalogo_audiovisual (solo MATERIAL)
create or replace function public.fn_copiar_plantilla_audiovisual()
returns trigger
language plpgsql
as $$
declare
  plantilla_nombre text;
  dims_sig text;
begin
  -- Solo para MATERIAL
  if new.tipo_alta = 'MATERIAL' and (new.es_contenedor is false or new.es_contenedor is null) then
    -- Calcular nombre de plantilla: nombre_base + dimensiones
    dims_sig := nullif(
      coalesce(
        nullif(concat_ws('x', nullif(new.dimensiones->>'ancho',''), nullif(new.dimensiones->>'largo',''), nullif(new.dimensiones->>'grosor','')), ''),
        nullif(concat_ws('x', nullif(new.dimensiones->>'diametro',''), nullif(new.dimensiones->>'largo','')), ''),
        nullif(concat_ws('x', nullif(new.dimensiones->>'alto',''), nullif(new.dimensiones->>'ancho',''), nullif(new.dimensiones->>'largo','')), '')
      ),
      ''
    );

    plantilla_nombre := trim(coalesce(new.nombre_base, regexp_replace(new.nombre, '\s+\d+\s*$', '')) || case when dims_sig is not null then ' ' || dims_sig else '' end);

    -- Insertar si no existe
    insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
    values (plantilla_nombre, 'MATERIAL', new.dimensiones, array['AUDIOVISUAL'], case when new.bodega_secundaria is not null then array[new.bodega_secundaria] else array[]::text[] end, 'Auto-copiado de catálogo')
    on conflict (nombre_plantilla) do nothing;
  end if;

  return new;
end;
$$;

-- Trigger para copiar automáticamente al insertar en catalogo_consumibles (solo MATERIAL)
create or replace function public.fn_copiar_plantilla_consumibles()
returns trigger
language plpgsql
as $$
declare
  plantilla_nombre text;
  dims_sig text;
  tipo_alta_val text;
begin
  -- Leer tipo_alta de campos_personalizados
  tipo_alta_val := coalesce(
    nullif(trim(new.campos_personalizados->>'tipo_alta'), ''),
    nullif(trim(new.campos_personalizados->>'Tipo de alta'), ''),
    nullif(trim(new.campos_personalizados->>'Tipo Alta'), ''),
    nullif(trim(new.campos_personalizados->>'Tipo de Alta'), '')
  );

  -- Solo para MATERIAL
  if tipo_alta_val = 'MATERIAL' and (new.es_contenedor is false or new.es_contenedor is null) then
    -- Calcular nombre de plantilla: nombre_base + dimensiones
    dims_sig := nullif(
      coalesce(
        nullif(concat_ws('x', nullif(new.dimensiones->>'ancho',''), nullif(new.dimensiones->>'largo',''), nullif(new.dimensiones->>'grosor','')), ''),
        nullif(concat_ws('x', nullif(new.dimensiones->>'diametro',''), nullif(new.dimensiones->>'largo','')), ''),
        nullif(concat_ws('x', nullif(new.dimensiones->>'alto',''), nullif(new.dimensiones->>'ancho',''), nullif(new.dimensiones->>'largo','')), '')
      ),
      ''
    );

    plantilla_nombre := trim(coalesce(new.nombre_base, regexp_replace(new.nombre, '\s+\d+\s*$', '')) || case when dims_sig is not null then ' ' || dims_sig else '' end);

    -- Insertar si no existe
    insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
    values (plantilla_nombre, 'MATERIAL', new.dimensiones, array['CONSUMIBLES'], case when new.bodega_secundaria is not null then array[new.bodega_secundaria] else array[]::text[] end, 'Auto-copiado de catálogo')
    on conflict (nombre_plantilla) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trig_copiar_plantilla_hierros on public.catalogo_hierros;
create trigger trig_copiar_plantilla_hierros
  after insert on public.catalogo_hierros
  for each row execute function public.fn_copiar_plantilla_hierros();

drop trigger if exists trig_copiar_plantilla_audiovisual on public.catalogo_audiovisual;
create trigger trig_copiar_plantilla_audiovisual
  after insert on public.catalogo_audiovisual
  for each row execute function public.fn_copiar_plantilla_audiovisual();

drop trigger if exists trig_copiar_plantilla_consumibles on public.catalogo_consumibles;
create trigger trig_copiar_plantilla_consumibles
  after insert on public.catalogo_consumibles
  for each row execute function public.fn_copiar_plantilla_consumibles();

-- Triggers implementados para los 3 catálogos: Hierros, Audiovisual, Consumibles.

-- Ejemplo de inserción manual si quieres:
-- insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, descripcion)
-- values ('Piso 60x244x5', 'MATERIAL', '{"ancho":60,"largo":244,"grosor":5}', array['HIERROS'], 'Pisos estándar');

-- Para poblar inicialmente desde datos existentes:
-- Hierros
insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
select
  trim(coalesce(nombre_base, regexp_replace(nombre, '\s+\d+\s*$', '')) ||
       case when dimensiones is not null then ' ' || concat_ws('x', dimensiones->>'ancho', dimensiones->>'largo', dimensiones->>'grosor') else '' end),
  'MATERIAL',
  dimensiones,
  array['HIERROS'],
  case when bodega_secundaria is not null then array[bodega_secundaria] else array[]::text[] end,
  'Migrado de catálogo'
from public.catalogo_hierros
where tipo_alta = 'MATERIAL' and (es_contenedor is false or es_contenedor is null)
on conflict (nombre_plantilla) do nothing;

-- Actualizar bodega_secundaria en registros existentes de Hierros
update public.recetas_plantillas_materiales
set bodega_secundaria = case when h.bodega_secundaria is not null then array[h.bodega_secundaria] else array[]::text[] end
from public.catalogo_hierros h
where recetas_plantillas_materiales.catalogos = array['HIERROS']
  and h.tipo_alta = 'MATERIAL'
  and (h.es_contenedor is false or h.es_contenedor is null)
  and trim(coalesce(recetas_plantillas_materiales.nombre_plantilla, '')) = trim(coalesce(h.nombre_base, regexp_replace(h.nombre, '\s+\d+\s*$', '')) ||
       case when h.dimensiones is not null then ' ' || concat_ws('x', h.dimensiones->>'ancho', h.dimensiones->>'largo', h.dimensiones->>'grosor') else '' end);

-- Audiovisual
insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
select
  trim(coalesce(nombre_base, regexp_replace(nombre, '\s+\d+\s*$', '')) ||
       case when dimensiones is not null then ' ' || concat_ws('x', dimensiones->>'ancho', dimensiones->>'largo', dimensiones->>'grosor') else '' end),
  'MATERIAL',
  dimensiones,
  array['AUDIOVISUAL'],
  case when bodega_secundaria is not null then array[bodega_secundaria] else array[]::text[] end,
  'Migrado de catálogo'
from public.catalogo_audiovisual
where tipo_alta = 'MATERIAL' and (es_contenedor is false or es_contenedor is null)
on conflict (nombre_plantilla) do nothing;

-- Actualizar bodega_secundaria en registros existentes de Audiovisual
update public.recetas_plantillas_materiales
set bodega_secundaria = case when a.bodega_secundaria is not null then array[a.bodega_secundaria] else array[]::text[] end
from public.catalogo_audiovisual a
where recetas_plantillas_materiales.catalogos = array['AUDIOVISUAL']
  and a.tipo_alta = 'MATERIAL'
  and (a.es_contenedor is false or a.es_contenedor is null)
  and trim(coalesce(recetas_plantillas_materiales.nombre_plantilla, '')) = trim(coalesce(a.nombre_base, regexp_replace(a.nombre, '\s+\d+\s*$', '')) ||
       case when a.dimensiones is not null then ' ' || concat_ws('x', a.dimensiones->>'ancho', a.dimensiones->>'largo', a.dimensiones->>'grosor') else '' end);

-- Consumibles (tipo_alta de campos_personalizados)
insert into public.recetas_plantillas_materiales (nombre_plantilla, tipo, dimensiones, catalogos, bodega_secundaria, descripcion)
select
  trim(coalesce(c.nombre_base, regexp_replace(c.nombre, '\s+\d+\s*$', '')) ||
       case when c.dimensiones is not null then ' ' || concat_ws('x', c.dimensiones->>'ancho', c.dimensiones->>'largo', c.dimensiones->>'grosor') else '' end),
  'MATERIAL',
  c.dimensiones,
  array['CONSUMIBLES'],
  case when c.bodega_secundaria is not null then array[c.bodega_secundaria] else array[]::text[] end,
  'Migrado de catálogo'
from public.catalogo_consumibles c
where coalesce(
  nullif(trim(c.campos_personalizados->>'tipo_alta'), ''),
  nullif(trim(c.campos_personalizados->>'Tipo de alta'), ''),
  nullif(trim(c.campos_personalizados->>'Tipo Alta'), ''),
  nullif(trim(c.campos_personalizados->>'Tipo de Alta'), '')
) = 'MATERIAL' and (c.es_contenedor is false or c.es_contenedor is null)
on conflict (nombre_plantilla) do nothing;

-- Actualizar bodega_secundaria en registros existentes de Consumibles
update public.recetas_plantillas_materiales
set bodega_secundaria = case when c.bodega_secundaria is not null then array[c.bodega_secundaria] else array[]::text[] end
from public.catalogo_consumibles c
where recetas_plantillas_materiales.catalogos = array['CONSUMIBLES']
  and coalesce(
    nullif(trim(c.campos_personalizados->>'tipo_alta'), ''),
    nullif(trim(c.campos_personalizados->>'Tipo de alta'), ''),
    nullif(trim(c.campos_personalizados->>'Tipo Alta'), ''),
    nullif(trim(c.campos_personalizados->>'Tipo de Alta'), '')
  ) = 'MATERIAL' and (c.es_contenedor is false or c.es_contenedor is null)
  and trim(coalesce(recetas_plantillas_materiales.nombre_plantilla, '')) = trim(coalesce(c.nombre_base, regexp_replace(c.nombre, '\s+\d+\s*$', '')) ||
       case when c.dimensiones is not null then ' ' || concat_ws('x', c.dimensiones->>'ancho', c.dimensiones->>'largo', c.dimensiones->>'grosor') else '' end);
