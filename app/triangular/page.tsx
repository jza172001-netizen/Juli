"use client";

import { useState } from "react";
import { triangularAccion } from "./actions";

export default function PaginaTriangular() {
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarConsulta(e: React.FormEvent) {
    e.preventDefault();
    if (!pregunta.trim()) return;

    setCargando(true);
    setError(null);
    setRespuesta(null);

    try {
      const resultado = await triangularAccion(pregunta);
      setRespuesta(resultado);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Triangular</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consulta en lenguaje natural sobre tu corpus documental, con citas a
        las fuentes.
      </p>

      <form onSubmit={manejarConsulta} className="mt-6 space-y-4">
        <textarea
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="¿Qué quieres saber de tus documentos?"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none"
          rows={4}
          disabled={cargando}
        />
        <button
          type="submit"
          disabled={cargando || !pregunta.trim()}
          className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-slate-700"
        >
          {cargando ? "Consultando…" : "Consultar"}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {respuesta && (
        <div className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="font-semibold text-slate-900">Análisis</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {respuesta}
          </div>
          <p className="text-xs text-slate-500">
            Descargo: el motor asiste; la decisión final es del abogado.
          </p>
        </div>
      )}
    </main>
  );
}
