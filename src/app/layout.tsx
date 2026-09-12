import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { MARCA } from "@/lib/marca";
import "./globals.css";

// Archivo variável: o eixo de largura (wdth) é usado nos títulos, em .titulo.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: {
    default: `${MARCA.descricaoCurta} — ${MARCA.nome}`,
    template: `%s · ${MARCA.nome}`,
  },
  description:
    "Agende limpeza residencial, passadoria, pós-obra ou serviço corporativo em Curitiba e na Região Metropolitana. O pagamento fica retido na plataforma e só chega à profissional depois que o serviço é concluído.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-pedra-50 text-pedra-900">{children}</body>
    </html>
  );
}
