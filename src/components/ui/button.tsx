import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[0.98]",
  outline:
    "border border-border bg-card hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]",
  ghost: "hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]",
  destructive:
    "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-3 py-2 text-base",
  sm: "h-8 rounded-md px-3 text-sm",
  lg: "h-11 rounded-md px-6 text-base",
  icon: "size-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-all duration-300 ease-fluid",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || pending}
      {...props}
    >
      {pending && (
        <span className="flex items-center gap-[3px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="pixel-loader-cell size-1 rounded-[1px] bg-current"
              style={{ animationDelay: `${i * 160}ms` }}
            />
          ))}
        </span>
      )}
      {children}
    </button>
  );
}
