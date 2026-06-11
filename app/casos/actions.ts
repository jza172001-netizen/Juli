"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";

export async function crearCaso(formData: FormData) {
  const supabase = await crearClienteServidor();
  const valor = String(formData.get("valor_estimado") ?? "").trim();
  const clienteId = String(formData.get("cliente_id"));

  // Verificar pertenencia: RLS limita el select a clientes propios,
  // así que un ID ajeno (aunque exista) no aparece.
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .maybeSingle();

  if (!cliente) {
    throw new Error("Cliente no encontrado");
  }

  const { error } = await supabase.from("casos").insert({
    cliente_id: clienteId,
    tipo: String(formData.get("tipo")).trim(),
    valor_estimado: valor ? Number(valor) : null,
  });

  if (error) {
    throw new Error(`No se pudo abrir el caso: ${error.message}`);
  }

  revalidatePath("/casos");
}
