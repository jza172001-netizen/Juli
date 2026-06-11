"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/app/(auth)/login/actions";

const enlaces = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/clientes", etiqueta: "Clientes" },
  { href: "/casos", etiqueta: "Casos" },
  { href: "/documentos", etiqueta: "Documentos" },
  { href: "/cursos", etiqueta: "Cursos" },
  { href: "/triaje", etiqueta: "Triaje" },
  { href: "/kyc", etiqueta: "KYC" },
  { href: "/triangular", etiqueta: "Triangular" },
];

function esActivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navegacion({ emailUsuario }: { emailUsuario?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3">
        <nav className="flex flex-wrap items-center gap-1">
          <Link
            href="/"
            className="mr-3 flex items-center gap-2 text-sm font-bold tracking-wide text-slate-900"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-xs text-white">
              N
            </span>
            NÚCLEO
          </Link>
          {enlaces.map((e) => {
            const activo = esActivo(pathname, e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={
                  activo
                    ? "rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                    : "rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                }
              >
                {e.etiqueta}
              </Link>
            );
          })}
        </nav>
        <form action={cerrarSesion} className="flex items-center gap-3">
          {emailUsuario && (
            <span className="hidden text-xs text-slate-400 sm:inline">
              {emailUsuario}
            </span>
          )}
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
