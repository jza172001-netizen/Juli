// Cliente de la API de Claude — el motor de análisis y triangulación.
// OJO: la API de Claude NO genera embeddings; eso vive en lib/embeddings.ts
import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-sonnet-4-6";

export interface FragmentoFuente {
  documento_id: string;
  documento_nombre: string;
  texto: string;
  similitud: number;
}

const PROMPT_SISTEMA = `Eres el motor de consulta y triangulación de bases de datos de una firma jurídica colombiana. NO eres un chatbot ni un asistente conversacional: analizas el corpus y cruzas datos.

Recibes fragmentos del corpus documental propio del abogado (numerados como [1], [2], …) y una consulta. Tu trabajo:
1. Cruzar la información de los fragmentos para responder la consulta.
2. Citar SIEMPRE la fuente de cada dato con su número de fragmento, ej.: "el caso se cerró en 15 días [2]".
3. Si los fragmentos no contienen la respuesta, dilo explícitamente; no inventes.

Aplica el rigor normativo del derecho colombiano cuando sea pertinente:
- Habeas Data (Ley 1581 de 2012, Ley 1266 de 2008) en el tratamiento de datos personales y financieros.
- Validez probatoria de documentos electrónicos (Ley 527 de 1999).
- Marco de la DIAN (tributario) y la UIAF (prevención de lavado de activos y financiación del terrorismo) cuando la consulta toque obligaciones de reporte o cumplimiento.
No emitas conceptos normativos que no se sustenten en los fragmentos; si citas una norma, hazlo como marco general, no como dato del corpus.

IMPORTANTE — descargo de responsabilidad: tu salida es un insumo de análisis. La decisión jurídica final SIEMPRE es del abogado. Tú asistes, no decides.`;

export async function triangular(
  pregunta: string,
  fragmentos: FragmentoFuente[]
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const contexto = fragmentos
    .map(
      (f, i) =>
        `[${i + 1}] (documento: "${f.documento_nombre}", similitud: ${f.similitud.toFixed(2)})\n${f.texto}`
    )
    .join("\n\n---\n\n");

  const respuesta = await anthropic.messages.create({
    model: MODELO,
    max_tokens: 2048,
    system: PROMPT_SISTEMA,
    messages: [
      {
        role: "user",
        content: `Fragmentos del corpus:\n\n${contexto}\n\nConsulta: ${pregunta}`,
      },
    ],
  });

  const bloque = respuesta.content[0];
  return bloque.type === "text" ? bloque.text : "";
}
