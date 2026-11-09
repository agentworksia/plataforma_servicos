import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-botao text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marinho-600 focus-visible:ring-offset-2 focus-visible:ring-offset-areia-50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-marinho-800 text-white hover:bg-marinho-900",
        outline: "border border-areia-300 bg-white text-areia-900 hover:border-areia-400 hover:bg-areia-100",
        ghost: "text-areia-700 hover:bg-areia-100",
        danger: "bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";
