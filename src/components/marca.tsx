import Link from "next/link";
import Image from "next/image";
import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";

/** Só a casa com o risco e a folha — o nome vem escrito ao lado, em tipografia. */
export function Simbolo({ className, largura = 56 }: { className?: string; largura?: number }) {
  return (
    <Image
      src={MARCA.simbolo}
      alt=""
      width={largura}
      height={Math.round(largura * 0.6)}
      className={className}
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
      <Simbolo largura={88} className="h-auto w-11" />
      <span className="titulo text-lg">{MARCA.nome}</span>
    </Link>
  );
}

/**
 * Marca d'água: o símbolo grande, fixo e quase apagado, atrás de tudo.
 * Fica acima do fundo da página mas abaixo do conteúdo (que sobe com z-10),
 * então some sob as seções que têm fundo próprio — é o comportamento desejado.
 */
export function MarcaDagua() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden select-none"
    >
      <Image
        src={MARCA.simbolo}
        alt=""
        width={1400}
        height={840}
        priority={false}
        className="w-[min(135vw,1200px)] opacity-[0.055]"
      />
    </div>
  );
}
