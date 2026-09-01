import * as React from "react";
import { cn } from "@/lib/utils";

const cores = {
  neutro: "bg-slate-100 text-slate-700",
  amarelo: "bg-amber-100 text-amber-800",
  verde: "bg-teal-100 text-teal-800",
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
