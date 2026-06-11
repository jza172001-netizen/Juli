-- Migración 0002: módulo de gestión académica (cursos y ponencias)
-- Cambio incremental sobre el esquema de la Fase 0. Centraliza el
-- material académico del abogado (hoy disperso en Drive).
-- Idempotente: se puede correr sobre un esquema que ya tiene Fase 0.

-- ── Tablas ──────────────────────────────────────────────────
create table if not exists cursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'curso',              -- curso, ponencia, taller
  descripcion text,
  entidad text,
  fecha date,
  lugar text,
  estado text not null default 'programado',        -- programado, dictado, archivado
  creado_por uuid not null default auth.uid() references auth.users(id),
  creado_en timestamptz not null default now()
);

-- Hash SHA-256 del material: trazabilidad Ley 527 también aquí.
create table if not exists materiales_curso (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos(id) on delete cascade,
  nombre text not null,
  ruta_storage text not null,
  hash text not null,
  tipo_mime text,
  tamano_bytes bigint,
  subido_por uuid not null default auth.uid() references auth.users(id),
  subido_en timestamptz not null default now()
);

-- ── Auditoría (reutiliza registrar_auditoria() de la Fase 0) ──
drop trigger if exists auditar_cursos on cursos;
create trigger auditar_cursos
  after insert or update or delete on cursos
  for each row execute function registrar_auditoria();

drop trigger if exists auditar_materiales_curso on materiales_curso;
create trigger auditar_materiales_curso
  after insert or update or delete on materiales_curso
  for each row execute function registrar_auditoria();

-- ── RLS ─────────────────────────────────────────────────────
alter table cursos enable row level security;
alter table materiales_curso enable row level security;

create policy "cursos propios" on cursos
  for all using (creado_por = auth.uid()) with check (creado_por = auth.uid());

create policy "materiales propios" on materiales_curso
  for all using (subido_por = auth.uid()) with check (subido_por = auth.uid());

-- ── Storage: bucket privado de material académico ───────────
insert into storage.buckets (id, name, public)
values ('materiales', 'materiales', false)
on conflict (id) do nothing;

create policy "subir material propio" on storage.objects
  for insert with check (
    bucket_id = 'materiales'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "leer material propio" on storage.objects
  for select using (
    bucket_id = 'materiales'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "borrar material propio" on storage.objects
  for delete using (
    bucket_id = 'materiales'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
