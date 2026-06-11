import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";
import { crearCurso, subirMaterial } from "./actions";

const etiquetaTipo: Record<string, string> = {
  curso: "Curso",
  ponencia: "Ponencia",
  taller: "Taller",
};

export default async function PaginaCursos() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: cursos } = await supabase
    .from("cursos")
    .select("*, materiales_curso(id, nombre, tamano_bytes)")
    .order("creado_en", { ascending: false });

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Cursos y ponencias</h1>
        <p className="mt-1 text-sm text-slate-500">
          Centraliza tu material académico — fuera de Drive, con respaldo y hash
          (Ley 527)
        </p>

        {/* Crear curso / ponencia */}
        <form
          action={crearCurso}
          className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input
            name="titulo"
            required
            placeholder="Título"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
          />
          <select
            name="tipo"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            defaultValue="ponencia"
          >
            <option value="curso">Curso</option>
            <option value="ponencia">Ponencia</option>
            <option value="taller">Taller</option>
          </select>
          <input
            name="entidad"
            placeholder="Entidad / organizador (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="lugar"
            placeholder="Lugar (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="fecha"
            type="date"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="descripcion"
            placeholder="Descripción (opcional)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Crear
          </button>
        </form>

        {/* Subir material a un curso existente */}
        {(cursos ?? []).length > 0 && (
          <form
            action={subirMaterial}
            className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3"
          >
            <select
              name="curso_id"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Añadir material a…
              </option>
              {(cursos ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
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
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Subir material
            </button>
          </form>
        )}

        {/* Listado */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(cursos ?? []).map((c) => {
            const materiales =
              (c.materiales_curso as { id: string; nombre: string }[]) ?? [];
            return (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <h2 className="font-medium">{c.titulo}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {etiquetaTipo[c.tipo] ?? c.tipo}
                  </span>
                </div>
                {c.entidad && (
                  <p className="mt-1 text-sm text-slate-500">{c.entidad}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {c.fecha
                    ? new Date(c.fecha).toLocaleDateString("es-CO")
                    : "Sin fecha"}
                  {c.lugar ? ` · ${c.lugar}` : ""}
                </p>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    Material ({materiales.length})
                  </p>
                  {materiales.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {materiales.map((m) => (
                        <li key={m.id} className="text-sm text-slate-600">
                          📄 {m.nombre}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">
                      Sin material todavía.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {(cursos ?? []).length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400 sm:col-span-2 lg:col-span-3">
              Sin cursos ni ponencias todavía. Crea el primero arriba.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
