"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Estado = { erro?: string } | undefined;
type Acao = (prev: Estado, formData: FormData) => Promise<Estado>;

export function ActionForm({
  action,
  children,
  className,
  submitLabel,
  pendingLabel = "Salvando…",
  variant,
  size,
  confirm,
}: {
  action: Acao;
  children?: ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState<Estado, FormData>(action, undefined);

  return (
    <form
      action={formAction}
      className={cn("space-y-2", className)}
      onSubmit={confirm ? (ev) => void (!window.confirm(confirm) && ev.preventDefault()) : undefined}
    >
      {children}
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
      {state?.erro && <p className="text-sm text-red-600">{state.erro}</p>}
    </form>
  );
}
