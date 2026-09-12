import Link from "next/link";
import { MARCA } from "@/lib/marca";
import { Araucaria } from "@/components/marca";

const LINKS = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/agendar", label: "Agendar um serviço" },
  { href: "/seja-profissional", label: "Trabalhar como diarista" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Privacidade" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-pedra-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:flex-row sm:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 text-pinho-800">
            <Araucaria className="size-5 text-pinho-600" />
            <span className="titulo text-base">{MARCA.nome}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-pedra-600">
            Limpeza residencial e corporativa em {MARCA.regiao}. O pagamento fica retido na plataforma até o
            serviço terminar.
          </p>
        </div>

        <nav className="grid gap-2 text-sm sm:text-right">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-pedra-600 hover:text-pinho-700">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-pedra-200">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-pedra-500">
          © {new Date().getFullYear()} {MARCA.nome} — {MARCA.regiao}
        </p>
      </div>
    </footer>
  );
}
