-- Limpiar tablas existentes si es necesario
drop table if exists public.recetas_especificas_materiales cascade;
drop table if exists public.recetas_especificas cascade;

-- Recrear tabla para recetas específicas (por código)
create table public.recetas_especificas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rubro text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por text
);

-- Índices para mejor rendimiento
create index idx_recetas_especificas_activo on public.recetas_especificas(activo);
create index idx_recetas_especificas_rubro on public.recetas_especificas(rubro);
create index idx_recetas_especificas_creado_en on public.recetas_especificas(creado_en);

-- Comentarios
comment on table public.recetas_especificas is 'Recetas creadas a partir de códigos específicos del catálogo';
comment on column public.recetas_especificas.nombre is 'Nombre de la receta específica';
comment on column public.recetas_especificas.rubro is 'Rubro al que pertenece la receta';

-- Políticas RLS para recetas_especificas
alter table public.recetas_especificas enable row level security;

create policy "recetas_especificas_select" on public.recetas_especificas for select using (true);
create policy "recetas_especificas_insert" on public.recetas_especificas for insert with check (true);
create policy "recetas_especificas_update" on public.recetas_especificas for update using (true);