import type { ReactNode } from "react";
import { Logo } from "@/components/marca";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-pedra-50 px-4 py-12">
      <Logo className="mb-8" />
      {children}
    </div>
  );
}
