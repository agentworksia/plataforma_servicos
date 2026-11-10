import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pg e o adapter do Prisma usam APIs de Node que não devem passar pelo bundler do servidor.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],

  // Cabeçalhos de segurança. Falta uma CSP, que exige testar cada origem usada pelas
  // telas — está anotada em SEGURANCA-PAGAMENTOS.md como próximo passo.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Impede que o site seja embutido em iframe de terceiro (clickjacking sobre
          // o botão de pagar).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nenhuma tela usa câmera, microfone ou geolocalização.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
