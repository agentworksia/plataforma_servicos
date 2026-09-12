import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-cartao border border-pedra-200 bg-white p-8 shadow-[0_18px_40px_-24px_rgb(20_61_45_/_0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
