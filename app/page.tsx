import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase-server";
import { Navegacion } from "@/components/navegacion";

const modulos = [
  {
    href: "/clientes",
    titulo: "Clientes",
    descripcion: "Personas y empresas con su autorización Habeas Data.",
    fase: "Fase 1",
  },
  {
    href: "/casos",
    titulo: "Casos",
    descripcion: "Casos con estado, valor estimado y decisión de triaje.",
    fase: "Fase 1",
  },
  {
    href: "/documentos",
    titulo: "Documentos",
    descripcion: "Repositorio con hash de integridad (Ley 527).",
    fase: "Fase 1",
  },
  {
    href: "/cursos",
    titulo: "Cursos y ponencias",
    descripcion: "Centraliza tu material académico, fuera de Drive.",
    fase: "Fase 1",
  },
  {
    href: "/triaje",
    titulo: "Triaje",
    descripcion: "Semáforo: ¿caso rápido de flujo de caja o pantano?",
    fase: "Fase 2",
  },
  {
    href: "/kyc",
    titulo: "KYC",
    descripcion: "Cruce contra listas restrictivas (ONU, OFAC, PEP).",
    fase: "Fase 2",
  },
  {
    href: "/triangular",
    titulo: "Triangular",
    descripcion: "Consulta en lenguaje natural sobre el corpus, con citas.",
    fase: "Fase 3",
  },
];

export default async function PaginaInicio() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { count: nClientes },
    { count: nCasos },
    { count: nDocumentos },
    { count: nCursos },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("casos").select("*", { count: "exact", head: true }),
    supabase.from("documentos").select("*", { count: "exact", head: true }),
    supabase.from("cursos").select("*", { count: "exact", head: true }),
  ]);

  return (
    <>
      <Navegacion emailUsuario={user?.email} />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="mt-1 text-sm text-slate-500">
          {nClientes ?? 0} clientes · {nCasos ?? 0} casos · {nDocumentos ?? 0}{" "}
          documentos · {nCursos ?? 0} cursos
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-medium">{m.titulo}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {m.fase}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{m.descripcion}</p>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
