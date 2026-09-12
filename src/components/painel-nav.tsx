"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

export function PainelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Só o item mais específico fica aceso: "/admin" não acende em "/admin/ranking".
  const atual = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const ativo = item.href === atual;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-botao px-3 py-1.5 text-sm font-medium transition-colors",
              ativo ? "bg-pinho-700 text-white" : "text-pedra-600 hover:bg-pedra-100 hover:text-pinho-800",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
