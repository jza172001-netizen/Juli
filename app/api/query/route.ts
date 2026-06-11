// POST /api/query — Consulta al motor de triangulación.
// Recibe { pregunta }, vectoriza, recupera fragmentos del corpus
// propio (RLS) y devuelve el análisis de Claude con citas.
// Misma lógica que la server action de /triangular, expuesta como
// API para integraciones (ej. automatizaciones del abogado).
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { generarEmbeddings } from "@/lib/embeddings";
import { triangular, type FragmentoFuente } from "@/lib/claude";
import { registrarAccion } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let pregunta: string;
  try {
    const cuerpo = await request.json();
    pregunta = String(cuerpo.pregunta ?? "").trim();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!pregunta) {
    return NextResponse.json({ error: "Falta la pregunta" }, { status: 400 });
  }

  try {
    const [embedding] = await generarEmbeddings([pregunta]);

    const { data: fragmentos, error } = await supabase.rpc("buscar_chunks", {
      consulta_embedding: embedding,
      limite: 8,
    });

    if (error) {
      return NextResponse.json(
        { error: `Error en la búsqueda: ${error.message}` },
        { status: 500 }
      );
    }

    if (!fragmentos || fragmentos.length === 0) {
      return NextResponse.json({
        respuesta:
          "No encontré documentos relevantes en tu corpus para responder esta pregunta.",
        fuentes: [],
      });
    }

    const fuentes = fragmentos as FragmentoFuente[];
    const respuesta = await triangular(pregunta, fuentes);

    await registrarAccion(supabase, user.id, "CONSULTA", "triangular", undefined, {
      pregunta,
      fragmentos_usados: fuentes.length,
    });

    return NextResponse.json({
      respuesta,
      fuentes: fuentes.map((f) => ({
        documento_id: f.documento_id,
        documento_nombre: f.documento_nombre,
        similitud: f.similitud,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
