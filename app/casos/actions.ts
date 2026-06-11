"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";

export async function crearCaso(formData: FormData) {
  const supabase = await crearClienteServidor();
  const valor = String(formData.get("valor_estimado") ?? "").trim();

  const { error } = await supabase.from("casos").insert({
    cliente_id: String(formData.get("cliente_id")),
    tipo: String(formData.get("tipo")).trim(),
    valor_estimado: valor ? Number(valor) : null,
  });

  if (error) {
    throw new Error(`No se pudo abrir el caso: ${error.message}`);
  }

  revalidatePath("/casos");
}
