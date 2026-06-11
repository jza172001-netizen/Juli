import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { crearCliente } from "./actions";

export default async function PaginaClientes() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("creado_en", { ascending: false });

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Clientes</h1>

        <form
          action={crearCliente}
          className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            name="nombre"
            required
            placeholder="Nombre completo / razón social"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="tipo_identificacion"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue="CC"
          >
            <option value="CC">Cédula (CC)</option>
            <option value="CE">Cédula extranjería (CE)</option>
            <option value="NIT">NIT</option>
            <option value="PA">Pasaporte</option>
          </select>
          <input
            name="identificacion"
            required
            placeholder="Número de identificación"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="telefono"
            placeholder="Teléfono (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
            <input type="checkbox" name="habeas_data" className="h-4 w-4" />
            El titular firmó / aceptó la autorización de tratamiento de datos
            (Habeas Data, Ley 1581 de 2012)
          </label>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Registrar cliente
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Identificación</th>
                <th className="px-4 py-3">Habeas Data</th>
                <th className="px-4 py-3">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(clientes ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.tipo_identificacion} {c.identificacion}
                  </td>
                  <td className="px-4 py-3">
                    {c.autorizacion_habeas_data ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        autorizado
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                        pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(c.creado_en).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))}
              {(clientes ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Sin clientes todavía. Registra el primero arriba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
