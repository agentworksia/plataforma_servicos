import * as React from "react";
import { cn } from "@/lib/utils";

// A estrutura vem da borda, não de sombra: sombra fica reservada ao cartão de preço da capa.
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-cartao border border-pedra-200 bg-white p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("titulo-secao text-lg text-pedra-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-sm leading-relaxed text-pedra-600", className)} {...props} />;
}
