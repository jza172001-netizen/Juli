// POST /api/kyc — Wrapper del proveedor de listas restrictivas.
// Recibe { identificacion, tipo_identificacion?, cliente_id? },
// consulta al proveedor (ONU/OFAC/PEP) y guarda el informe completo
// en consultas_kyc como evidencia con fecha y hora.
import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { consultarKYC, proveedorConfigurado } from "@/lib/kyc-provider";

export async function POST(request: NextRequest) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!proveedorConfigurado()) {
    return NextResponse.json(
      {
        error:
          "Proveedor de KYC sin configurar. Define KYC_PROVEEDOR, KYC_API_URL y KYC_API_KEY (Fase 2: elegir Verdata / TusDatos.co).",
      },
      { status: 503 }
    );
  }

  let identificacion: string;
  let tipoIdentificacion: string;
  let clienteId: string | null;
  try {
    const cuerpo = await request.json();
    identificacion = String(cuerpo.identificacion ?? "").trim();
    tipoIdentificacion = String(cuerpo.tipo_identificacion ?? "CC");
    clienteId = cuerpo.cliente_id ? String(cuerpo.cliente_id) : null;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!identificacion) {
    return NextResponse.json(
      { error: "Falta la identificación (cédula/NIT)" },
      { status: 400 }
    );
  }

  try {
    const resultado = await consultarKYC(identificacion, tipoIdentificacion);

    // La consulta misma es evidencia: se guarda completa con fecha/hora
    const { data: consulta, error } = await supabase
      .from("consultas_kyc")
      .insert({
        cliente_id: clienteId,
        identificacion_consultada: identificacion,
        resultado_json: resultado,
        proveedor: resultado.proveedor,
      })
      .select("id, consultado_en")
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error al guardar evidencia: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      consulta_id: consulta.id,
      consultado_en: consulta.consultado_en,
      hallazgos: resultado.hallazgos,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
