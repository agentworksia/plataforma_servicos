import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-20 w-full rounded-botao border border-areia-300 bg-white px-3 py-2 text-sm text-areia-900 placeholder:text-areia-400 focus-visible:border-marinho-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600/25 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
