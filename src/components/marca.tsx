import Link from "next/link";
import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";

/** Araucária estilizada — a árvore-símbolo de Curitiba, com as pontas dos galhos viradas para cima. */
export function Araucaria({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 22V6" />
      <path d="M12 9 5.6 12.2M5.6 12.2V9.7" />
      <path d="M12 9l6.4 3.2M18.4 12.2V9.7" />
      <path d="M12 6 7 8.4M7 8.4V6.3" />
      <path d="M12 6l5 2.4M17 8.4V6.3" />
      <path d="M12 3.2 9.2 4.8M12 3.2l2.8 1.6" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-botao text-pinho-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pinho-600 focus-visible:ring-offset-4 focus-visible:ring-offset-pedra-50",
        className,
      )}
    >
      <Araucaria className="size-6 text-pinho-600" />
      <span className="titulo text-lg">{MARCA.nome}</span>
    </Link>
  );
}
