import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-body-md transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-border bg-surface px-4 py-2 hover:border-primary-strong hover:bg-surface-high",
        primary: "bg-primary-strong px-4 py-2 text-[#00315d] hover:opacity-90",
        ghost: "px-2 py-2 text-muted hover:text-text hover:bg-surface-high",
        danger: "bg-[#93000A] px-4 py-2 text-[#FFDAD6] hover:brightness-110"
      },
      size: {
        default: "h-10",
        sm: "h-8 px-3",
        lg: "h-12 px-4"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
