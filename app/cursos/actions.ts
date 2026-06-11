"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";

export async function crearCurso(formData: FormData) {
  const supabase = await crearClienteServidor();
  const fecha = String(formData.get("fecha") ?? "").trim();

  const { error } = await supabase.from("cursos").insert({
    titulo: String(formData.get("titulo")).trim(),
    tipo: String(formData.get("tipo")),
    entidad: String(formData.get("entidad") ?? "").trim() || null,
    fecha: fecha || null,
    lugar: String(formData.get("lugar") ?? "").trim() || null,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
  });

  if (error) {
    throw new Error(`No se pudo crear el curso/ponencia: ${error.message}`);
  }

  revalidatePath("/cursos");
}

export async function subirMaterial(formData: FormData) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const cursoId = String(formData.get("curso_id") ?? "").trim();
  if (!cursoId) {
    throw new Error("Selecciona un curso o ponencia");
  }

  // Verificar pertenencia: RLS limita el select a cursos propios.
  const { data: curso } = await supabase
    .from("cursos")
    .select("id")
    .eq("id", cursoId)
    .maybeSingle();
  if (!curso) {
    throw new Error("Curso no encontrado");
  }

  const archivo = formData.get("archivo") as File;
  if (!archivo || archivo.size === 0) {
    throw new Error("No se proporcionó archivo");
  }

  const buffer = await archivo.arrayBuffer();
  const hash = createHash("sha256").update(Buffer.from(buffer)).digest("hex");

  const ruta = `${user.id}/${Date.now()}-${archivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from("materiales")
    .upload(ruta, archivo, { upsert: false });

  if (uploadError) {
    throw new Error(`Error al subir: ${uploadError.message}`);
  }

  const { error: dbError } = await supabase.from("materiales_curso").insert({
    curso_id: cursoId,
    nombre: archivo.name,
    ruta_storage: ruta,
    hash,
    tipo_mime: archivo.type,
    tamano_bytes: archivo.size,
  });

  if (dbError) {
    // Compensación: no dejar archivos huérfanos en el storage
    await supabase.storage.from("materiales").remove([ruta]);
    throw new Error(`Error al registrar material: ${dbError.message}`);
  }

  revalidatePath("/cursos");
}
