# NÚCLEO — Instrucciones para Claude Code

**Proyecto:** Plataforma de bases de datos jurídicas + KYC + motor de triangulación
**Cliente:** Abogado empresario (Colombia)
**Estado:** Fase 0 completa (setup inicial), Fase 1 lista para construir

---

## 1. Resumen ejecutivo

NÚCLEO es un repositorio documental jurídico con **validez legal** (Ley 527 + Habeas Data) que permite al abogado:
1. Guardar documentos, casos y clientes de forma segura (RLS por usuario).
2. **Triangular** su corpus interno con listas restrictivas (KYC).
3. Consultar sus documentos en lenguaje natural (motor Claude + embeddings).

**NO es:** un chatbot, un CRM de marketing, ni un case management completo.  
**SÍ es:** el diferenciador de su negocio — tomar casos rápido, saber cuáles son rentables.

---

## 2. Stack técnico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend + API | Next.js + TypeScript | Un repo, patrón conocido. |
| Base de datos | Supabase (Postgres) | Relacional sólido + RLS (Habeas Data). |
| Vectores | pgvector (Supabase) | Embeddings en la misma BD, sin infra extra. |
| Embeddings | Voyage AI o OpenAI | Claude API no genera embeddings; se compran aparte. |
| IA / análisis | Claude Sonnet 4.6 | Motor de consulta y triangulación. |
| KYC | API externa (Verdata / TusDatos.co) | **COMPRAR, no construir.** |
| Deploy | Vercel | Usuario ya lo usa; patrón conocido. |

**Esquema de BD:** `db/schema.sql` — tablas, RLS, triggers de auditoría, búsqueda semántica.

---

## 3. Estructura de carpetas

```
nucleo/
├── CLAUDE.md                  # Este archivo
├── README.md
├── package.json, tsconfig.json, next.config.ts, postcss.config.mjs
├── .env.example               # Plantilla de secretos (NUNCA commitear .env)
├── middleware.ts              # Protección de rutas, refresh de sesión
├── app/
│   ├── layout.tsx, globals.css
│   ├── page.tsx               # Panel inicial
│   ├── (auth)/
│   │   └── login/             # Login + logout
│   ├── clientes/              # Registrar clientes + Habeas Data
│   ├── casos/                 # Abrir casos, ver estado
│   ├── documentos/            # Subir docs (hash SHA-256 Ley 527)
│   ├── triaje/                # Semáforo: caso rápido o pantano
│   ├── kyc/                   # Consultar listas restrictivas
│   └── triangular/            # Motor de consulta (IA)
├── lib/
│   ├── supabase.ts            # Cliente navegador
│   ├── supabase-server.ts     # Cliente servidor + RLS
│   ├── claude.ts              # Cliente Claude API
│   ├── embeddings.ts          # Voyage / OpenAI + fragmentación
│   ├── kyc-provider.ts        # Wrapper API de KYC
│   └── audit.ts               # Registro manual en audit_log
├── components/
│   ├── navegacion.tsx         # Barra de nav + logout
│   └── semaforo.tsx           # Componente 🟢🟡🔴
├── db/
│   ├── schema.sql             # Estado completo del esquema
│   └── migrations/
│       └── 0001_esquema_inicial.sql
└── .gitignore
```

---

## 4. Fases y prioridades

| Fase | Estado | Qué es |
|---|---|---|
| **0 — Setup** | ✅ COMPLETA | Repo, Supabase, Auth, esquema, deploy Vercel. |
| **1 — Repositorio (MVP núcleo)** | 🔨 CONSTRUCCIÓN | Clientes + casos + documentos con autorización + audit log. |
| **2 — KYC + Triaje** | ⏳ SIGUIENTE | Integración API KYC, flujo semáforo. Elegir proveedor primero. |
| **3 — Motor de triangulación** | ⏳ DESPUÉS | Pipeline RAG: ingerir docs, embeddings, búsqueda semántica + Claude. |
| **4 — Hardening legal** | ⏳ FINAL | Ley 527 probatoria (sellado, firma electrónica), RNBD. |

**Hoy la Fase 1 es el enfoque.** Entregarle repositorio + auditoría es victoria rápida y cimiento del resto.

---

## 5. Variables de entorno (.env)

Plantilla en `.env.example`. Nunca commitear `.env` real.

```bash
# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role>  # Solo servidor

# Claude API (Fase 3)
ANTHROPIC_API_KEY=<key>

# Embeddings (Fase 3) — elegir UNO
VOYAGE_API_KEY=<key>                      # Recomendado
# OPENAI_API_KEY=<key>

# KYC (Fase 2) — por confirmar
KYC_PROVEEDOR=pendiente                   # Cambiar a Verdata / TusDatos
KYC_API_URL=
KYC_API_KEY=
```

---

## 6. Flujos principales

### 6.1 Registrar cliente (Fase 1)
1. Usuario llena formulario: nombre, identificación, Habeas Data checkbox.
2. Se crea registro en `clientes` con `autorizacion_habeas_data=true/false`.
3. Si autoriza, se guarda el texto en `autorizaciones` (evidencia firmada + IP).
4. **RLS:** el usuario solo ve sus clientes.

### 6.2 Subir documento (Fase 1)
1. Usuario sube archivo → calcular SHA-256 del contenido (hash Ley 527).
2. Subir a `storage.documentos` con ruta `{user.id}/{timestamp}-{nombre}`.
3. Guardar registro en `documentos` con hash + metadata.
4. **Trigger:** `auditar_documentos` registra la acción en `audit_log`.

### 6.3 Consultar motor de triangulación (Fase 3)
1. Usuario escribe pregunta → vectorizar con Voyage/OpenAI.
2. Buscar fragmentos similares en `doc_chunks` (pgvector + RLS).
3. Pasar fragmentos + pregunta a Claude → análisis con citas.
4. Respuesta con fuentes verificables.
5. **Audit:** registrar consulta manualmente en `audit_log`.

### 6.4 Triaje (Fase 2)
1. Usuario llega → sistema cruza KYC (listas restrictivas) + corpus propio.
2. Semáforo: 🟢 (rápido, tómalo) · 🟡 (revisar) · 🔴 (pantano, descarta).
3. La decisión final **siempre es del abogado.** El semáforo sugiere.

---

## 7. Compliance y consideraciones legales

| Norma | Para qué | Quién | Estado |
|---|---|---|---|
| **Ley 527 (1999)** | Validez de docs electrónicos, hash. | Sistema (por diseño). | ✅ Base de datos + hash |
| **Ley 1581/Decreto 1377** | Autorización de tratamiento de datos. | Abogado (responsable) + tú (encargado). | ✅ Autorizaciones + RLS |
| **Ley 1266 (2008)** | Habeas data financiero. | Abogado. | ✅ Campo en clientes |
| **RNBD (SIC)** | Registro de BD si > umbrales. | Abogado. | ⏳ Fase 4 |

**Dos cosas ineludibles:**
1. **Contrato de encargo:** tú eres "encargado", abogado es "responsable" de los datos. Define responsabilidades legales.
2. **Disclaimer de responsabilidad:** "El motor asiste; la decisión es del abogado." Incluir en UI y términos.

---

## 8. Consideraciones de desarrollo

### Seguridad
- **RLS en todas las tablas:** cada usuario solo ve lo suyo. No confíes en lógica de aplicación.
- **Auth.uid() en checks:** `auth.uid()` es seguro; nunca fíes en `user_id` del cliente.
- **Storage privado:** bucket `documentos` con RLS; users suben a `{user.id}/*`.
- **Nunca públicos:** auth keys de terceros NUNCA en código. Usa `.env` y rutas del servidor.

### Rendimiento
- **Búsqueda semántica (pgvector):** índice HNSW en `doc_chunks.embedding`. Escalable a millones.
- **RLS:** un select sin WHERE clausa sobre 1M filas tardará — usa índices inteligentemente.
- **Caché:** Next.js ISR / revalidatePath para evitar re-queries innecesarias.

### Testing
- **No hay tests unitarios aún.** Prioridad: MVP funcional + seguro.
- **Test manual:** login, crear cliente, subir doc, consultar motor.
- **Integración Supabase:** usar proyecto de desarrollo (staging).

---

## 9. Tareas abiertas (antes de Fase 2)

- [ ] Crear proyecto Supabase (gratuito ok para MVP).
- [ ] Correr `db/schema.sql` en el SQL Editor de Supabase.
- [ ] Deployar a Vercel (enlazar repo, variables de entorno).
- [ ] Crear usuario de prueba en Supabase Auth.
- [ ] Testear flujo: login → crear cliente → subir doc → ver audit_log.
- [ ] Elegir proveedor KYC (Verdata / TusDatos.co — cotizar).

---

## 10. Linters y formatting

- **TypeScript:** tsconfig.json ya está configurado (strict mode).
- **Prettier / ESLint:** no están activados, pero se pueden añadir (baja prioridad).
- **next/lint:** `npm run lint` si se configura Next.js lint.

---

## 11. Cómo pedirle cambios a Claude Code

**En la rama:** `claude/plan-execution-gc3lz9`

Ejemplos:
- "Añade un campo 'notas' a la tabla de casos y síncronalo con el formulario."
- "El semáforo de triaje debería mostrar la razón (ej. 'cliente en lista OFAC')."
- "Crea un endpoint `/api/ingest` para fragmentar e indexar docs en la subida."
- "Cuando se sube un documento, fragmentarlo automáticamente y generar embeddings (Voyage)."

Sé específico: qué módulo, qué cambio, por qué.

---

## 12. Referencias rápidas

- **Docs de Supabase:** https://supabase.com/docs
- **Next.js App Router:** https://nextjs.org/docs/app
- **Ley 527:** https://www.oas.org/legal/english/ley527.htm
- **Claude API:** https://anthropic.com/docs
- **Voyage AI (embeddings):** https://docs.voyageai.com

---

**Última actualización:** 2026-06-11  
**Preparado por:** Plan Proyecto NÚCLEO
