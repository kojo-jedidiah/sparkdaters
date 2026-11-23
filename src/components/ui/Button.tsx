"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-600 hover:to-brand-700 active:scale-[0.98]",
      secondary:
        "bg-surface-100 text-surface-900 hover:bg-surface-200 active:scale-[0.98]",
      ghost: "bg-transparent text-surface-700 hover:bg-surface-100",
      danger:
        "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
      outline:
        "border-2 border-surface-200 bg-white text-surface-900 hover:border-brand-300 hover:bg-brand-50",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm rounded-xl",
      md: "h-11 px-5 text-sm rounded-2xl",
      lg: "h-12 px-6 text-base rounded-2xl",
      xl: "h-14 px-8 text-base rounded-2xl font-medium",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
