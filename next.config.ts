import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Repositorio documental jurídico: los PDFs escaneados superan
      // con facilidad el límite por defecto de 1MB de server actions.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
