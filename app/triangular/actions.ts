"use server";

import { crearClienteServidor } from "@/lib/supabase-server";
import { generarEmbeddings, fragmentarTexto } from "@/lib/embeddings";
import { triangular } from "@/lib/claude";
import { registrarAccion } from "@/lib/audit";

export async function triangularAccion(pregunta: string): Promise<string> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  // 1. Vectorizar la pregunta
  const [embedding] = await generarEmbeddings([pregunta]);

  // 2. Buscar fragmentos similares en el corpus propio
  const { data: fragmentos, error } = await supabase.rpc("buscar_chunks", {
    consulta_embedding: embedding,
    limite: 8,
  });

  if (error) {
    throw new Error(`Error al buscar fragmentos: ${error.message}`);
  }

  if (!fragmentos || fragmentos.length === 0) {
    return "No encontré documentos relevantes en tu corpus para responder esta pregunta.";
  }

  // 3. Consultar a Claude con los fragmentos
  const respuesta = await triangular(
    pregunta,
    fragmentos.map((f: any) => ({
      documento_id: f.documento_id,
      documento_nombre: f.documento_nombre,
      texto: f.texto,
      similitud: f.similitud,
    }))
  );

  // 4. Registrar la consulta en el audit log
  await registrarAccion(supabase, user.id, "CONSULTA", "triangular", undefined, {
    pregunta,
    fragmentos_usados: fragmentos.length,
  });

  return respuesta;
}
