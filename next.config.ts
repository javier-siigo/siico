import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // /documentacion/[slug] lee docs/procesos con fs en tiempo de ejecución:
  // sin esto los .md no viajan en la función serverless de Vercel.
  outputFileTracingIncludes: {
    "/documentacion/**": ["./docs/procesos/**/*.md"],
  },
};

export default nextConfig;
