import Link from "next/link";
import { cerrarSesion } from "@/app/(auth)/login/actions";

const enlaces = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/clientes", etiqueta: "Clientes" },
  { href: "/casos", etiqueta: "Casos" },
  { href: "/documentos", etiqueta: "Documentos" },
  { href: "/triaje", etiqueta: "Triaje" },
  { href: "/kyc", etiqueta: "KYC" },
  { href: "/triangular", etiqueta: "Triangular" },
];

export function Navegacion({ emailUsuario }: { emailUsuario?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <nav className="flex items-center gap-1">
          <span className="mr-4 text-sm font-bold tracking-wide">NÚCLEO</span>
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {e.etiqueta}
            </Link>
          ))}
        </nav>
        <form action={cerrarSesion} className="flex items-center gap-3">
          {emailUsuario && (
            <span className="text-xs text-slate-400">{emailUsuario}</span>
          )}
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
