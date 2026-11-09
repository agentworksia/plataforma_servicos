import Link from "next/link";
import Image from "next/image";
import { MARCA } from "@/lib/marca";
import { cn } from "@/lib/utils";

/** O "P" do logo, sem o texto — o nome vem escrito ao lado, em tipografia. */
export function Simbolo({ className, lado = 40 }: { className?: string; lado?: number }) {
  return <Image src={MARCA.simbolo} alt="" width={lado} height={lado} className={className} priority />;
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${MARCA.nome} — página inicial`}
      className={cn(
        "inline-flex items-center gap-2 rounded-botao text-marinho-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600 focus-visible:ring-offset-4 focus-visible:ring-offset-areia-100",
        className,
      )}
    >
      <Simbolo lado={72} className="h-9 w-9" />
      <span className="titulo text-lg lowercase tracking-tight">{MARCA.nome}</span>
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
      className="pointer-events-none fixed inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
    >
      <Image
        src={MARCA.simbolo}
        alt=""
        width={1100}
        height={1100}
        priority={false}
        className="w-[min(110vw,900px)] opacity-[0.05]"
      />
    </div>
  );
}
