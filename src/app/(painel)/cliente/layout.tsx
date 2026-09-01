import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/dal";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  await requireRole("CLIENTE");
  return <>{children}</>;
}
