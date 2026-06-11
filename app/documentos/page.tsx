import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { subirDocumento } from "./actions";

export default async function PaginaDocumentos() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: documentos }, { data: casos }] = await Promise.all([
    supabase
      .from("documentos")
      .select("*, casos(tipo), clientes(nombre)")
      .order("subido_en", { ascending: false }),
    supabase.from("casos").select("id, tipo").order("tipo"),
  ]);

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Documentos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Repositorio con hash SHA-256 (trazabilidad Ley 527)
        </p>

        <form
          action={subirDocumento}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              name="caso_id"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Caso (opcional)…
              </option>
              {(casos ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tipo}
                </option>
              ))}
            </select>
            <input
              type="file"
              name="archivo"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 sm:col-span-2"
            >
              Subir documento
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Caso / Cliente</th>
                <th className="px-4 py-3">Tamaño</th>
                <th className="px-4 py-3">Subido</th>
                <th className="px-4 py-3">Hash (Ley 527)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(documentos ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium">{d.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {(d.casos as { tipo: string } | null)?.tipo ||
                      (d.clientes as { nombre: string } | null)?.nombre ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {d.tamano_bytes
                      ? (d.tamano_bytes / 1024).toFixed(1) + " KB"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(d.subido_en).toLocaleDateString("es-CO")}
                  </td>
                  <td className="font-mono text-xs text-slate-400">
                    {d.hash.slice(0, 16)}…
                  </td>
                </tr>
              ))}
              {(documentos ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Sin documentos todavía.
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
