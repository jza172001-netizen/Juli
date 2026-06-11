import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { InsigniaTriaje, type ColorTriaje } from "@/components/semaforo";
import { crearCaso } from "./actions";

export default async function PaginaCasos() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: casos }, { data: clientes }] = await Promise.all([
    supabase
      .from("casos")
      .select("*, clientes(nombre)")
      .order("creado_en", { ascending: false }),
    supabase.from("clientes").select("id, nombre").order("nombre"),
  ]);

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Casos</h1>

        <form
          action={crearCaso}
          className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <select
            name="cliente_id"
            required
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
          <input
            name="tipo"
            required
            placeholder="Tipo (ej. eliminación de reporte)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="valor_estimado"
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor estimado (COP)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Abrir caso
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Triaje</th>
                <th className="px-4 py-3">Valor estimado</th>
                <th className="px-4 py-3">Apertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(casos ?? []).map((caso) => (
                <tr key={caso.id}>
                  <td className="px-4 py-3 font-medium">
                    {(caso.clientes as { nombre: string } | null)?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{caso.tipo}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {caso.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <InsigniaTriaje color={caso.decision_triaje as ColorTriaje | null} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {caso.valor_estimado
                      ? Number(caso.valor_estimado).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          maximumFractionDigits: 0,
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(caso.fecha_apertura).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))}
              {(casos ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Sin casos todavía.
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
