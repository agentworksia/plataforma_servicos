import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/dal";

export default async function ProfissionalLayout({ children }: { children: ReactNode }) {
  await requireRole("PROFISSIONAL");
  return <>{children}</>;
}
