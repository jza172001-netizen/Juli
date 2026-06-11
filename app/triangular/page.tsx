import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { ConsultaTriangular } from "./consulta";

export default async function PaginaTriangular() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <ConsultaTriangular />
    </>
  );
}
