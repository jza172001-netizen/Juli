import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { proveedorConfigurado } from "@/lib/kyc-provider";
import { consultarKYC } from "./actions";

export default async function PaginaKYC() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const disponible = proveedorConfigurado();

  const [{ data: clientes }, { data: consultas }] = await Promise.all([
    supabase.from("clientes").select("id, nombre, identificacion").order("nombre"),
    disponible
      ? supabase
          .from("consultas_kyc")
          .select("*, clientes(nombre)")
          .order("consultado_en", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">KYC</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cruce contra listas restrictivas (ONU, OFAC, PEP)
        </p>

        {!disponible && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              ⚠️ Proveedor de KYC sin configurar. Define KYC_API_URL,
              KYC_API_KEY y KYC_PROVEEDOR en .env para habilitar esta función.
            </p>
          </div>
        )}

        {disponible && (
          <form
            action={consultarKYC}
            className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
          >
            <select
              name="cliente_id"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Cliente…
              </option>
              {(clientes ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Consultar
            </button>
          </form>
        )}

        {disponible && (consultas ?? []).length > 0 && (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Identificación</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Consultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(consultas ?? []).map((c) => {
                  const hallazgos = c.resultado_json?.hallazgos;
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-medium">
                        {(c.clientes as { nombre: string } | null)?.nombre ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {c.identificacion_consultada}
                      </td>
                      <td className="px-4 py-3">
                        {hallazgos?.en_listas_restrictivas ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                            En listas ⚠️
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            Sin hallazgos
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(c.consultado_en).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
