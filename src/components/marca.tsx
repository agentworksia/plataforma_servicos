import Link from "next/link";
import Image from "next/image";
import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";

/**
 * O selo é circular, mas o arquivo é quadrado com fundo claro — o rounded-full apara
 * os cantos em vez de deixar um quadrado pálido sobre o fundo da página.
 */
export function Selo({ className, tamanho = 40 }: { className?: string; tamanho?: number }) {
  return (
    <Image
      src={MARCA.logo}
      alt=""
      width={tamanho}
      height={tamanho}
      className={cn("rounded-full", className)}
      priority
    />
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${MARCA.nome} — página inicial`}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-botao text-mar-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mar-600 focus-visible:ring-offset-4 focus-visible:ring-offset-pedra-50",
        className,
      )}
    >
      <Selo tamanho={40} className="size-10" />
      <span className="titulo text-lg">{MARCA.nome}</span>
    </Link>
  );
}
