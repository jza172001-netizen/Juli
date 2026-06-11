// El semáforo de triaje: la pantalla que da plata.
// 🟢 caso rápido de flujo de caja · 🟡 revisar manual · 🔴 pantano o riesgo.
// El semáforo SUGIERE; la decisión final siempre es del abogado.

export type ColorTriaje = "verde" | "amarillo" | "rojo";

const estilos: Record<ColorTriaje, { fondo: string; texto: string; etiqueta: string }> = {
  verde: {
    fondo: "bg-green-100 border-green-300",
    texto: "text-green-800",
    etiqueta: "Verde — caso rápido de flujo de caja",
  },
  amarillo: {
    fondo: "bg-amber-100 border-amber-300",
    texto: "text-amber-800",
    etiqueta: "Amarillo — requiere revisión manual",
  },
  rojo: {
    fondo: "bg-red-100 border-red-300",
    texto: "text-red-800",
    etiqueta: "Rojo — pantano o riesgo, descartar",
  },
};

export function Semaforo({
  color,
  detalle,
}: {
  color: ColorTriaje;
  detalle?: string;
}) {
  const e = estilos[color];
  return (
    <div className={`rounded-lg border p-4 ${e.fondo}`}>
      <p className={`font-semibold ${e.texto}`}>{e.etiqueta}</p>
      {detalle && <p className={`mt-1 text-sm ${e.texto}`}>{detalle}</p>}
      <p className="mt-2 text-xs text-slate-500">
        El sistema sugiere; la decisión final es del abogado.
      </p>
    </div>
  );
}

export function InsigniaTriaje({ color }: { color: ColorTriaje | null }) {
  if (!color) {
    return <span className="text-xs text-slate-400">sin triaje</span>;
  }
  const colores: Record<ColorTriaje, string> = {
    verde: "bg-green-500",
    amarillo: "bg-amber-400",
    rojo: "bg-red-500",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs capitalize text-slate-600">
      <span className={`h-2.5 w-2.5 rounded-full ${colores[color]}`} />
      {color}
    </span>
  );
}
