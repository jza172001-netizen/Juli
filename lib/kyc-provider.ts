// Wrapper del proveedor de KYC / listas restrictivas.
// COMPRAR, no construir: scrapear ONU/OFAC/60+ listas es un infierno
// de mantenimiento. El proveedor concreto está por confirmar
// (Verdata / TusDatos.co — decisión abierta del plan).
//
// Listas que el abogado pide cruzar:
//   - ONU  (Consejo de Seguridad)
//   - OFAC (Tesoro de EE. UU. — listas SDN). El abogado mencionó
//     "OSIC", que se interpreta como una referencia imprecisa a OFAC.
//   - PEP  (Personas Expuestas Políticamente)
// El proveedor elegido en Fase 2 debe cubrir al menos estas tres.
//
// Toda consulta se guarda en `consultas_kyc` como evidencia con
// fecha y hora — eso lo hace la ruta /api/kyc, no este módulo.

export interface ResultadoKYC {
  proveedor: string;
  identificacion: string;
  /** Respuesta cruda del proveedor: se guarda completa como evidencia. */
  resultado: Record<string, unknown>;
  /** Resumen para el semáforo de triaje. */
  hallazgos: {
    en_listas_restrictivas: boolean;
    listas: string[];
    nivel_riesgo: "bajo" | "medio" | "alto" | "desconocido";
  };
}

export function proveedorConfigurado(): boolean {
  return Boolean(
    process.env.KYC_API_URL &&
      process.env.KYC_API_KEY &&
      process.env.KYC_PROVEEDOR &&
      process.env.KYC_PROVEEDOR !== "pendiente"
  );
}

export async function consultarKYC(
  identificacion: string,
  tipoIdentificacion: string = "CC"
): Promise<ResultadoKYC> {
  if (!proveedorConfigurado()) {
    throw new Error(
      "Proveedor de KYC sin configurar. Falta elegir proveedor (Verdata / TusDatos.co) y definir KYC_API_URL, KYC_API_KEY y KYC_PROVEEDOR."
    );
  }

  // Adaptador genérico: ajustar al contrato real del proveedor elegido
  // en la Fase 2 (cada proveedor tiene su propio formato de petición).
  const res = await fetch(process.env.KYC_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.KYC_API_KEY}`,
    },
    body: JSON.stringify({
      documento: identificacion,
      tipo_documento: tipoIdentificacion,
    }),
  });

  if (!res.ok) {
    throw new Error(`El proveedor de KYC respondió ${res.status}: ${await res.text()}`);
  }

  const resultado = (await res.json()) as Record<string, unknown>;

  return {
    proveedor: process.env.KYC_PROVEEDOR!,
    identificacion,
    resultado,
    hallazgos: interpretarResultado(resultado),
  };
}

// Interpretación conservadora mientras no haya proveedor confirmado:
// si no podemos leer el formato, el riesgo es "desconocido" (amarillo).
function interpretarResultado(
  resultado: Record<string, unknown>
): ResultadoKYC["hallazgos"] {
  const listas = Array.isArray(resultado.listas)
    ? (resultado.listas as string[])
    : [];
  const enListas = listas.length > 0;
  return {
    en_listas_restrictivas: enListas,
    listas,
    nivel_riesgo: enListas ? "alto" : "desconocido",
  };
}
