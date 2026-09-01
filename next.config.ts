import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg e o adapter do Prisma usam APIs de Node que não devem passar pelo bundler do servidor.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
