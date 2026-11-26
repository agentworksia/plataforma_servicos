"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * Até aqui os links do topo eram `hidden md:flex`: no celular sumiam, e quem queria
 * "Trabalhar conosco" só via "Entrar" e "Agendar" — alguém acabou se cadastrando como
 * cliente por não achar o caminho da diarista.
 */
export function MenuMobile({ links }: { links: { href: string; label: string }[] }) {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();

  // Navegar fecha o painel: o link para "/#precos" não troca de rota, então sem isso
  // o menu ficaria aberto por cima da seção para onde ele acabou de rolar.
  useEffect(() => setAberto(false), [caminho]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-mobile"
        aria-label={aberto ? "Fechar o menu" : "Abrir o menu"}
        className="flex size-9 items-center justify-center rounded-botao text-areia-700 hover:bg-areia-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600/25"
      >
        {aberto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>

      {aberto && (
        <div
          id="menu-mobile"
          className="absolute inset-x-0 top-16 border-b border-areia-200 bg-areia-50 shadow-[0_18px_40px_-24px_rgb(15_43_76_/_0.35)]"
        >
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="rounded-botao px-3 py-3 text-areia-700 hover:bg-areia-100 hover:text-marinho-800"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
