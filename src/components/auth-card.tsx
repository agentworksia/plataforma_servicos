import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm", className)}>
      {children}
    </div>
  );
}
