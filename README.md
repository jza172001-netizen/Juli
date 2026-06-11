# NÚCLEO

Plataforma de bases de datos jurídicas + KYC + motor de triangulación para abogados empresarios.

## ¿Qué es?

Un repositorio documental con **validez legal** (Ley 527 + Habeas Data) que permite:

1. **Guardar documentos** de casos y clientes en un solo sitio (fuera de Drive).
2. **Triangular** información: cruzar datos internos con listas restrictivas (ONU, OFAC, PEP).
3. **Consultar en lenguaje natural** sobre tus documentos, con citas a las fuentes.

Todo con auditoría completa (quién tocó qué y cuándo) y protección de datos por arquitectura (RLS en cada tabla).

## Fases

| Fase | Estado | Qué hace |
|---|---|---|
| **0 — Setup** | ✅ Hecho | Repo, Supabase, Auth, esquema, deploy Vercel. |
| **1 — Repositorio** | 🔨 Construcción | Clientes, casos, documentos + autorización + audit log. |
| **2 — KYC + Triaje** | ⏳ Próxima | Consultar listas restrictivas, semáforo de decisión. |
| **3 — Triangulación** | ⏳ Después | Buscar en el corpus con IA, análisis con citas. |
| **4 — Hardening legal** | ⏳ Final | Ley 527 probatoria, firma electrónica, RNBD. |

## Tech stack

- **Frontend:** Next.js 15 + TypeScript
- **Base de datos:** Supabase (Postgres + pgvector + RLS)
- **IA:** Claude API (análisis) + Voyage AI / OpenAI (embeddings)
- **KYC:** API externa (Verdata / TusDatos.co)
- **Deploy:** Vercel

## Requisitos previos

1. Supabase (proyecto gratuito).
2. Vercel (cuenta gratuita).
3. Variables de entorno (ver `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (servidor)
   - `ANTHROPIC_API_KEY` (para Fase 3)
   - `VOYAGE_API_KEY` u `OPENAI_API_KEY` (para Fase 3)

## Instalación local (desarrollo)

```bash
# Clonar repo
git clone <repo> && cd nucleo

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves reales

# Dev server
npm run dev
# Abre http://localhost:3000

# Build para producción
npm run build
npm start
```

## Setup de Supabase

1. Crea proyecto en https://supabase.com
2. Ve al SQL Editor y corre `db/schema.sql` (copiar y pegar todo).
   - Si ya lo corriste antes del módulo académico, aplica solo
     `db/migrations/0002_modulo_academico.sql` (cursos y ponencias).
3. Crea un usuario de prueba en **Authentication > Users**.
4. Copia las claves en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` (Settings > API > Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings > API > anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings > API > service_role key)

## Flujos principales (Fase 1)

### 1. Registrar cliente
```
GET /clientes → Formulario
POST /clientes/actions → crearCliente()
  ├─ Crear registro en clientes
  ├─ Si autoriza Habeas Data → guardar en autorizaciones
  └─ Trigger → auditar en audit_log
```

### 2. Subir documento
```
GET /documentos → Formulario
POST /documentos/actions → subirDocumento()
  ├─ Calcular SHA-256
  ├─ Subir a storage (ruta: {user.id}/{timestamp}-{nombre})
  ├─ Guardar en documentos (con hash)
  └─ Trigger → auditar en audit_log
```

### 3. Ver casos
```
GET /casos → Listado
  ├─ Cliente
  ├─ Tipo (ej. eliminación de reporte)
  ├─ Estado (abierto, en_curso, cerrado)
  └─ Triaje (vacío mientras no se implemente KYC)
```

## Seguridad (Habeas Data)

- **RLS en todas las tablas:** cada usuario solo ve lo suyo.
- **Auth.uid() en checks:** nunca uses `user_id` del cliente.
- **Storage privado:** documentos en bucket protegido por RLS.
- **Audit log:** quién tocó qué, cuándo (inmutable).
- **Contrato de encargo:** obligatorio (abogado = responsable, tú = encargado).

## Compliance

| Norma | Implementación |
|---|---|
| **Ley 527 (docs electrónicos)** | Hash SHA-256 + timestamp en cada documento. |
| **Ley 1581 + Decreto 1377** | Autorización explícita, campo + tabla separada. |
| **Ley 1266 (Habeas data financiero)** | Campo `autorizacion_habeas_data` en clientes. |
| **RNBD** | A hacer en Fase 4. |

## API / Rutas

### Public
- `GET /login` — Formulario de login

### Protected (requieren sesión)
- `GET /` — Panel
- `GET /clientes` `POST /clientes/actions` — Clientes
- `GET /casos` `POST /casos/actions` — Casos
- `GET /documentos` `POST /documentos/actions` — Documentos
- `GET /cursos` `POST /cursos/actions` — Cursos y ponencias + material
- `GET /triaje` — Semáforo (Fase 2)
- `GET /kyc` `POST /kyc/actions` — KYC (Fase 2)
- `GET /triangular` `POST /triangular/actions` — Motor IA (Fase 3)

## Testing (Fase 1)

```
1. npm run dev
2. Abre http://localhost:3000/login
3. Entra con usuario de prueba (creado en Supabase)
4. Crea cliente + caso + sube documento
5. Verifica en Supabase: clientes, casos, documentos, audit_log
```

## Decisiones abiertas (antes de Fase 2)

- [ ] Proveedor KYC: ¿Verdata o TusDatos.co?
- [ ] ¿Un solo usuario (abogado) o equipo?
- [ ] Mantener LemonTech para case management o construir lo mínimo?

## Estructura de directorios

Ver `CLAUDE.md` sección 3.

## Licencia

Privada (cliente abogado empresario, Colombia).

## Contacto / Soporte

En duda, revisa `CLAUDE.md` o abre issue en el repo.

---

**Estado:** Fase 1 en construcción  
**Última actualización:** 2026-06-11  
**Preparado por:** Plan Proyecto NÚCLEO
