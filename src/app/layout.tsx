import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Serviços de limpeza em Curitiba e Região Metropolitana",
    template: "%s · Plataforma de Limpeza",
  },
  description:
    "Agende diaristas para limpeza residencial, passadoria, pós-obra e serviços corporativos em Curitiba e RMC. Profissionais verificadas, pagamento online.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900">{children}</body>
    </html>
  );
}
