import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-cartao border border-areia-200 bg-white p-8 shadow-[0_18px_40px_-24px_rgb(15_43_76_/_0.22)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
