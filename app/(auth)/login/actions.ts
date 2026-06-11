"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase-server";

export async function iniciarSesion(formData: FormData) {
  const supabase = await crearClienteServidor();

  // Se puede entrar con usuario corto ("juli") o correo completo:
  // sin "@" se asume el dominio interno @nucleo.app
  let email = String(formData.get("email")).trim().toLowerCase();
  if (email && !email.includes("@")) {
    email = `${email}@nucleo.app`;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: String(formData.get("password")),
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Credenciales inválidas")}`);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
