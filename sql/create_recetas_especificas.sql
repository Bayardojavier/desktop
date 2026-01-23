-- Crear tabla para recetas específicas (por código)
create table if not exists public.recetas_especificas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rubro text not null,
  materiales jsonb not null default '[]'::jsonb, -- Array de objetos con material_codigo, cantidad, observacion
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por text
);

-- Índices para mejor rendimiento
create index if not exists idx_recetas_especificas_activo on public.recetas_especificas(activo);
create index if not exists idx_recetas_especificas_rubro on public.recetas_especificas(rubro);
create index if not exists idx_recetas_especificas_creado_en on public.recetas_especificas(creado_en);

-- Comentarios
comment on table public.recetas_especificas is 'Recetas creadas a partir de códigos específicos del catálogo';
comment on column public.recetas_especificas.nombre is 'Nombre de la receta específica';
comment on column public.recetas_especificas.rubro is 'Rubro al que pertenece la receta';
comment on column public.recetas_especificas.materiales is 'Array JSON con los materiales: [{material_codigo, cantidad, observacion}]';