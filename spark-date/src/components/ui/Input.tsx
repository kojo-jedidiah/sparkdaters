"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full h-12 px-4 rounded-2xl border border-surface-200 bg-white text-surface-900 placeholder:text-surface-400",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400",
            "transition-all duration-200",
            error && "border-red-400 focus:ring-red-500/30 focus:border-red-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
