"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";
import { consultarKYC } from "@/lib/kyc-provider";

export async function consultarKYCAction(formData: FormData) {
  const supabase = await crearClienteServidor();
  const clienteId = String(formData.get("cliente_id"));

  const { data: cliente } = await supabase
    .from("clientes")
    .select("identificacion")
    .eq("id", clienteId)
    .single();

  if (!cliente) {
    throw new Error("Cliente no encontrado");
  }

  const resultado = await consultarKYC(cliente.identificacion);

  // La consulta misma es evidencia: si no se guarda, se falla visible.
  const { error } = await supabase.from("consultas_kyc").insert({
    cliente_id: clienteId,
    identificacion_consultada: cliente.identificacion,
    resultado_json: resultado,
    proveedor: resultado.proveedor,
  });

  if (error) {
    throw new Error(
      `La consulta KYC se ejecutó pero NO quedó guardada como evidencia: ${error.message}`
    );
  }

  revalidatePath("/kyc");
}

export { consultarKYCAction as consultarKYC };
