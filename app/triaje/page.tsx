import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { Semaforo } from "@/components/semaforo";

export default async function PaginaTriaje() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: casos } = await supabase
    .from("casos")
    .select("*, clientes(nombre)")
    .eq("estado", "abierto")
    .order("creado_en", { ascending: false });

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Triaje</h1>
        <p className="mt-1 text-sm text-slate-500">
          Semáforo: ¿caso rápido de flujo de caja o pantano?
        </p>

        <div className="mt-6 space-y-4">
          {(casos ?? []).map((caso) => (
            <div
              key={caso.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h2 className="font-semibold">
                    {(caso.clientes as { nombre: string } | null)?.nombre}
                  </h2>
                  <p className="text-sm text-slate-500">{caso.tipo}</p>
                </div>
                <div className="space-y-2">
                  {caso.decision_triaje ? (
                    <Semaforo color={caso.decision_triaje as any} />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Pendiente de triaje. Usa KYC para obtener una recomendación.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(casos ?? []).length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
              No hay casos abiertos.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
