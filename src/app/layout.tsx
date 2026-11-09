import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { MARCA } from "@/lib/marca";
import { MarcaDagua } from "@/components/marca";
import "./globals.css";

// Geométrica como o logotipo, mas com ajustes humanistas que a seguram nas
// tabelas do painel — onde a Archivo estendida de antes não conversava mais com a marca.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${MARCA.descricaoCurta} — ${MARCA.nome}`,
    template: `%s · ${MARCA.nome}`,
  },
  description:
    "Agende limpeza residencial, passadoria, pós-obra ou serviço corporativo em Curitiba, na Região Metropolitana e no litoral de Santa Catarina. O pagamento fica retido na plataforma e só chega à profissional depois que o serviço é concluído.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-areia-100 text-areia-900">
        <MarcaDagua />
        {/* O conteúdo sobe uma camada para ficar sempre na frente da marca d'água. */}
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
