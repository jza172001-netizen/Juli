import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NÚCLEO — Motor de consulta y triangulación",
  description:
    "Plataforma de bases de datos jurídicas: repositorio documental, KYC y triangulación de fuentes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
