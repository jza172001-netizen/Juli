"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";

const TEXTO_AUTORIZACION =
  "El titular autoriza el tratamiento de sus datos personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013, con la finalidad de gestión jurídica de su caso, consulta de bases de datos y listas restrictivas, y conservación documental. El titular puede ejercer sus derechos de conocer, actualizar, rectificar y suprimir sus datos.";

export async function crearCliente(formData: FormData) {
  const supabase = await crearClienteServidor();
  const habeasData = formData.get("habeas_data") === "on";
  const telefono = String(formData.get("telefono") ?? "").trim();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nombre: String(formData.get("nombre")).trim(),
      tipo_identificacion: String(formData.get("tipo_identificacion")),
      identificacion: String(formData.get("identificacion")).trim(),
      contacto: telefono ? { telefono } : {},
      autorizacion_habeas_data: habeasData,
      autorizacion_fecha: habeasData ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`No se pudo registrar el cliente: ${error.message}`);
  }

  // La autorización queda como registro independiente (evidencia)
  if (habeasData && cliente) {
    await supabase.from("autorizaciones").insert({
      cliente_id: cliente.id,
      texto_autorizacion: TEXTO_AUTORIZACION,
    });
  }

  revalidatePath("/clientes");
}
