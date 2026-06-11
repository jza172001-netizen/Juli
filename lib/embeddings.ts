// Proveedor de embeddings — pieza APARTE del stack (Claude no los genera).
// Por defecto Voyage AI (recomendado por Anthropic); OpenAI como respaldo.
// La dimensión debe coincidir con vector(1024) en db/schema.sql.

const DIMENSION = 1024;

export async function generarEmbeddings(textos: string[]): Promise<number[][]> {
  if (process.env.VOYAGE_API_KEY) {
    return embeddingsVoyage(textos);
  }
  if (process.env.OPENAI_API_KEY) {
    return embeddingsOpenAI(textos);
  }
  throw new Error(
    "Sin proveedor de embeddings: define VOYAGE_API_KEY u OPENAI_API_KEY (Fase 3)."
  );
}

async function embeddingsVoyage(textos: string[]): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: textos,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    throw new Error(`Voyage AI respondió ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

async function embeddingsOpenAI(textos: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: textos,
      dimensions: DIMENSION,
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI respondió ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// Fragmentación simple por párrafos con tope de caracteres.
// Suficiente para el MVP; afinar en Fase 3 (solapamiento, tokens).
export function fragmentarTexto(texto: string, maxCaracteres = 1500): string[] {
  const parrafos = texto.split(/\n\s*\n/);
  const chunks: string[] = [];
  let actual = "";

  for (const p of parrafos) {
    const limpio = p.trim();
    if (!limpio) continue;
    if (actual && actual.length + limpio.length + 2 > maxCaracteres) {
      chunks.push(actual);
      actual = "";
    }
    if (limpio.length > maxCaracteres) {
      for (let i = 0; i < limpio.length; i += maxCaracteres) {
        chunks.push(limpio.slice(i, i + maxCaracteres));
      }
    } else {
      actual = actual ? `${actual}\n\n${limpio}` : limpio;
    }
  }
  if (actual) chunks.push(actual);
  return chunks;
}
