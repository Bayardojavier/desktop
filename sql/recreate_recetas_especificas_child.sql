-- Recrear tabla para materiales de recetas específicas
create table public.recetas_especificas_materiales (
  id uuid primary key default gen_random_uuid(),
  receta_id uuid not null references public.recetas_especificas(id) on delete cascade,
  material_codigo text not null,
  material_nombre text,
  bodega_principal text,
  bodega_secundaria text[],
  cantidad numeric(10,2) not null,
  observacion text,
  creado_en timestamptz not null default now()
);

-- Índices para mejor rendimiento
create index idx_recetas_especificas_materiales_receta_id on public.recetas_especificas_materiales(receta_id);
create index idx_recetas_especificas_materiales_codigo on public.recetas_especificas_materiales(material_codigo);
create index idx_recetas_especificas_materiales_bodega_principal on public.recetas_especificas_materiales(bodega_principal);

-- Políticas RLS para recetas_especificas_materiales
alter table public.recetas_especificas_materiales enable row level security;

create policy "recetas_especificas_materiales_select" on public.recetas_especificas_materiales for select using (true);
create policy "recetas_especificas_materiales_insert" on public.recetas_especificas_materiales for insert with check (true);
create policy "recetas_especificas_materiales_update" on public.recetas_especificas_materiales for update using (true);