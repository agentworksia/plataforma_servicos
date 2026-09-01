"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string };

export function PainelNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              ativo ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
