import * as React from "react";
import { cn } from "@/lib/utils";

const cores = {
  neutro: "bg-pedra-100 text-pedra-700",
  amarelo: "bg-folha-100 text-folha-700",
  verde: "bg-mar-100 text-mar-800",
  vermelho: "bg-red-100 text-red-800",
} as const;

export function Badge({
  cor = "neutro",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { cor?: keyof typeof cores }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cores[cor], className)}
      {...props}
    />
  );
}
