import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

    const variantStyles = {
      default:
        "bg-blue-900 text-white hover:bg-blue-950 focus-visible:ring-blue-800",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-100",
      outline:
        "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-900 focus-visible:ring-slate-400 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
      ghost:
        "hover:bg-slate-100 text-slate-900 hover:text-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
      destructive:
        "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600",
    };

    const sizeStyles = {
      default: "h-11 px-4 py-2 sm:h-10",
      sm: "h-11 px-3 text-xs sm:h-9",
      lg: "h-12 px-6 text-base",
      icon: "h-11 w-11 p-0 sm:h-10 sm:w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

