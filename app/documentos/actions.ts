"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";

export async function subirDocumento(formData: FormData) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const archivo = formData.get("archivo") as File;
  if (!archivo) {
    throw new Error("No se proporcionó archivo");
  }

  const buffer = await archivo.arrayBuffer();
  const hash = createHash("sha256")
    .update(Buffer.from(buffer))
    .digest("hex");

  const ruta = `${user.id}/${Date.now()}-${archivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documentos")
    .upload(ruta, archivo, { upsert: false });

  if (uploadError) {
    throw new Error(`Error al subir: ${uploadError.message}`);
  }

  const casoId = String(formData.get("caso_id") ?? "").trim() || null;

  const { error: dbError } = await supabase.from("documentos").insert({
    caso_id: casoId,
    nombre: archivo.name,
    ruta_storage: ruta,
    hash,
    tipo_mime: archivo.type,
    tamano_bytes: archivo.size,
  });

  if (dbError) {
    throw new Error(`Error al registrar documento: ${dbError.message}`);
  }

  revalidatePath("/documentos");
}
