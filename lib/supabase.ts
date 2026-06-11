// Cliente de Supabase para el navegador (componentes cliente).
// Para Server Components / Route Handlers usar lib/supabase-server.ts
import { createBrowserClient } from "@supabase/ssr";

export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
