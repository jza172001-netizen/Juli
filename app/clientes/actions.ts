"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
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

  // La autorización queda como registro independiente (evidencia).
  // Si la evidencia NO se puede guardar, el cliente NO puede quedar
  // marcado como autorizado (Ley 1581): se revierte y se falla visible.
  if (habeasData && cliente) {
    const encabezados = await headers();
    const ip =
      encabezados.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    const { error: errorAutorizacion } = await supabase
      .from("autorizaciones")
      .insert({
        cliente_id: cliente.id,
        texto_autorizacion: TEXTO_AUTORIZACION,
        ip,
      });

    if (errorAutorizacion) {
      await supabase
        .from("clientes")
        .update({ autorizacion_habeas_data: false, autorizacion_fecha: null })
        .eq("id", cliente.id);
      throw new Error(
        `El cliente se creó pero NO quedó la evidencia de la autorización (se desmarcó Habeas Data): ${errorAutorizacion.message}`
      );
    }
  }

  revalidatePath("/clientes");
}
