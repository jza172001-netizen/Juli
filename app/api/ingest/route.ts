// POST /api/ingest — Pipeline de ingesta del motor de triangulación.
// Recibe { documento_id }, descarga el archivo del storage, extrae el
// texto, lo fragmenta, genera embeddings (Voyage/OpenAI) y guarda los
// chunks en doc_chunks. Por ahora solo extrae texto de archivos de
// texto plano (txt, md, csv, json); PDF/DOCX quedan para Fase 3.
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { generarEmbeddings, fragmentarTexto } from "@/lib/embeddings";
import { registrarAccion } from "@/lib/audit";

const MIME_TEXTO = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
];

export async function POST(request: NextRequest) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let documentoId: string;
  try {
    const cuerpo = await request.json();
    documentoId = String(cuerpo.documento_id ?? "");
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!documentoId) {
    return NextResponse.json(
      { error: "Falta documento_id" },
      { status: 400 }
    );
  }

  // RLS garantiza que solo se vean documentos propios
  const { data: documento, error: errorDoc } = await supabase
    .from("documentos")
    .select("id, nombre, ruta_storage, tipo_mime")
    .eq("id", documentoId)
    .single();

  if (errorDoc || !documento) {
    return NextResponse.json(
      { error: "Documento no encontrado" },
      { status: 404 }
    );
  }

  // MIME vacío o desconocido también se rechaza: los navegadores
  // reportan "" para extensiones raras y un binario pasaría el filtro.
  if (!documento.tipo_mime || !MIME_TEXTO.includes(documento.tipo_mime)) {
    return NextResponse.json(
      {
        error: `Extracción de texto para "${documento.tipo_mime || "desconocido"}" aún no soportada (Fase 3 cubrirá PDF/DOCX). Sube texto plano por ahora.`,
      },
      { status: 415 }
    );
  }

  const { data: archivo, error: errorDescarga } = await supabase.storage
    .from("documentos")
    .download(documento.ruta_storage);

  if (errorDescarga || !archivo) {
    return NextResponse.json(
      { error: `No se pudo descargar el archivo: ${errorDescarga?.message}` },
      { status: 500 }
    );
  }

  const texto = await archivo.text();
  if (!texto.trim()) {
    return NextResponse.json(
      { error: "El documento no tiene texto extraíble" },
      { status: 422 }
    );
  }

  const chunks = fragmentarTexto(texto);

  let embeddings: number[][];
  try {
    embeddings = await generarEmbeddings(chunks);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar embeddings" },
      { status: 502 }
    );
  }

  // Re-ingesta limpia: borrar chunks previos del documento.
  // El delete va después de generar los embeddings para minimizar la
  // ventana en que el documento queda desindexado.
  const { error: errorDelete } = await supabase
    .from("doc_chunks")
    .delete()
    .eq("documento_id", documento.id);

  if (errorDelete) {
    return NextResponse.json(
      { error: `Error al limpiar chunks previos: ${errorDelete.message}` },
      { status: 500 }
    );
  }

  const { error: errorInsert } = await supabase.from("doc_chunks").insert(
    chunks.map((textoChunk, i) => ({
      documento_id: documento.id,
      texto: textoChunk,
      embedding: embeddings[i],
    }))
  );

  if (errorInsert) {
    return NextResponse.json(
      {
        error: `Error al guardar chunks (el documento quedó desindexado; reintenta la ingesta): ${errorInsert.message}`,
      },
      { status: 500 }
    );
  }

  await registrarAccion(supabase, user.id, "INGESTA", "documentos", documento.id, {
    nombre: documento.nombre,
    chunks: chunks.length,
  });

  return NextResponse.json({
    ok: true,
    documento_id: documento.id,
    chunks_indexados: chunks.length,
  });
}
