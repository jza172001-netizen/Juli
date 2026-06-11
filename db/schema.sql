-- ============================================================
-- NÚCLEO — Esquema base (Fase 0)
-- Plataforma de bases de datos jurídicas + KYC + triangulación
--
-- Ejecutar en el SQL Editor de Supabase (o como migración).
-- RLS activado en TODAS las tablas: protección de datos por
-- arquitectura, no por promesa (Habeas Data por diseño).
-- ============================================================

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ── Clientes ────────────────────────────────────────────────
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo_identificacion text not null default 'CC', -- CC, CE, NIT, pasaporte
  identificacion text not null,
  contacto jsonb not null default '{}'::jsonb,    -- teléfono, email, dirección
  autorizacion_habeas_data boolean not null default false,
  autorizacion_fecha timestamptz,
  creado_por uuid not null default auth.uid() references auth.users(id),
  creado_en timestamptz not null default now(),
  unique (creado_por, tipo_identificacion, identificacion)
);

-- ── Casos ───────────────────────────────────────────────────
create table if not exists casos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  tipo text not null,                              -- ej. eliminación de reporte, habeas data
  estado text not null default 'abierto',          -- abierto, en_curso, cerrado, descartado
  valor_estimado numeric(14,2),
  fecha_apertura date not null default current_date,
  decision_triaje text check (decision_triaje in ('verde', 'amarillo', 'rojo')),
  notas text,
  creado_por uuid not null default auth.uid() references auth.users(id),
  creado_en timestamptz not null default now()
);

-- ── Documentos (hash = trazabilidad Ley 527) ────────────────
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid references casos(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null,
  ruta_storage text not null,
  hash text not null,                              -- SHA-256 del archivo al subir
  tipo_mime text,
  tamano_bytes bigint,
  subido_por uuid not null default auth.uid() references auth.users(id),
  subido_en timestamptz not null default now()
);

-- ── Fragmentos vectorizados (motor de triangulación, Fase 3) ─
-- vector(1024): dimensión de voyage-3; si se usa OpenAI
-- text-embedding-3-small, pasar dimensions=1024 en la petición.
create table if not exists doc_chunks (
  id bigint generated always as identity primary key,
  documento_id uuid not null references documentos(id) on delete cascade,
  texto text not null,
  embedding vector(1024),
  creado_por uuid not null default auth.uid() references auth.users(id),
  creado_en timestamptz not null default now()
);

create index if not exists doc_chunks_embedding_idx
  on doc_chunks using hnsw (embedding vector_cosine_ops);

-- ── Consultas KYC (la consulta misma es evidencia) ──────────
create table if not exists consultas_kyc (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  identificacion_consultada text not null,
  resultado_json jsonb not null,
  proveedor text not null,
  consultado_por uuid not null default auth.uid() references auth.users(id),
  consultado_en timestamptz not null default now()
);

-- ── Audit log (quién tocó qué y cuándo — Ley 527) ───────────
create table if not exists audit_log (
  id bigint generated always as identity primary key,
  usuario_id uuid,
  accion text not null,                            -- INSERT, UPDATE, DELETE, CONSULTA
  entidad text not null,
  entidad_id text,
  detalles jsonb,
  ocurrido_en timestamptz not null default now()
);

-- ── Autorizaciones Habeas Data (Ley 1581/2012) ──────────────
create table if not exists autorizaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  texto_autorizacion text not null,
  aceptada_en timestamptz not null default now(),
  ip inet,
  creado_por uuid not null default auth.uid() references auth.users(id)
);

-- ============================================================
-- Auditoría automática: trigger genérico sobre las tablas núcleo
-- ============================================================
create or replace function registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (usuario_id, accion, entidad, entidad_id, detalles)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce((case when tg_op = 'DELETE' then old.id else new.id end)::text, ''),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists auditar_clientes on clientes;
create trigger auditar_clientes
  after insert or update or delete on clientes
  for each row execute function registrar_auditoria();

drop trigger if exists auditar_casos on casos;
create trigger auditar_casos
  after insert or update or delete on casos
  for each row execute function registrar_auditoria();

drop trigger if exists auditar_documentos on documentos;
create trigger auditar_documentos
  after insert or update or delete on documentos
  for each row execute function registrar_auditoria();

drop trigger if exists auditar_consultas_kyc on consultas_kyc;
create trigger auditar_consultas_kyc
  after insert on consultas_kyc
  for each row execute function registrar_auditoria();

drop trigger if exists auditar_autorizaciones on autorizaciones;
create trigger auditar_autorizaciones
  after insert on autorizaciones
  for each row execute function registrar_auditoria();

-- ============================================================
-- RLS: cada usuario solo ve lo suyo
-- ============================================================
alter table clientes enable row level security;
alter table casos enable row level security;
alter table documentos enable row level security;
alter table doc_chunks enable row level security;
alter table consultas_kyc enable row level security;
alter table audit_log enable row level security;
alter table autorizaciones enable row level security;

create policy "clientes propios" on clientes
  for all using (creado_por = auth.uid()) with check (creado_por = auth.uid());

create policy "casos propios" on casos
  for all using (creado_por = auth.uid()) with check (creado_por = auth.uid());

create policy "documentos propios" on documentos
  for all using (subido_por = auth.uid()) with check (subido_por = auth.uid());

create policy "chunks propios" on doc_chunks
  for all using (creado_por = auth.uid()) with check (creado_por = auth.uid());

create policy "consultas kyc propias" on consultas_kyc
  for all using (consultado_por = auth.uid()) with check (consultado_por = auth.uid());

create policy "autorizaciones propias" on autorizaciones
  for all using (creado_por = auth.uid()) with check (creado_por = auth.uid());

-- El audit log: cada usuario lee solo sus acciones. Los triggers
-- escriben con security definer; las acciones manuales (ej. una
-- consulta al motor) solo pueden registrarse a nombre propio.
-- Nunca se permite UPDATE ni DELETE: el log es inmutable.
create policy "audit log lectura propia" on audit_log
  for select using (usuario_id = auth.uid());

create policy "audit log registro propio" on audit_log
  for insert with check (usuario_id = auth.uid());

-- ============================================================
-- Búsqueda semántica (motor de triangulación)
-- security invoker: respeta el RLS del usuario que consulta.
-- ============================================================
create or replace function buscar_chunks(
  consulta_embedding vector(1024),
  limite int default 8
)
returns table (
  documento_id uuid,
  documento_nombre text,
  texto text,
  similitud float
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d.id,
    d.nombre,
    c.texto,
    1 - (c.embedding <=> consulta_embedding) as similitud
  from doc_chunks c
  join documentos d on d.id = c.documento_id
  where c.embedding is not null
  order by c.embedding <=> consulta_embedding
  limit limite;
$$;

-- ============================================================
-- Storage: bucket privado de documentos
-- Cada usuario sube a su propia carpeta: {auth.uid()}/...
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

create policy "subir a carpeta propia" on storage.objects
  for insert with check (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "leer carpeta propia" on storage.objects
  for select using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "borrar de carpeta propia" on storage.objects
  for delete using (
    bucket_id = 'documentos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
