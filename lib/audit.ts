// Registro manual en el audit log para acciones que no pasan por
// triggers de tabla (ej. consultas al motor de triangulación).
// Las mutaciones sobre tablas núcleo ya se auditan solas por trigger.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function registrarAccion(
  supabase: SupabaseClient,
  usuarioId: string,
  accion: string,
  entidad: string,
  entidadId?: string,
  detalles?: Record<string, unknown>
) {
  await supabase.from("audit_log").insert({
    usuario_id: usuarioId,
    accion,
    entidad,
    entidad_id: entidadId ?? null,
    detalles: detalles ?? null,
  });
}
