import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", disabled && "opacity-60")}>
        {leftIcon != null && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"
            aria-hidden
          >
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={cn(
            "w-full h-11 rounded-lg border border-input bg-input-background text-sm text-foreground shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
            leftIcon ? "pl-10 pr-3" : "px-3",
            rightIcon ? "pr-10" : "",
            className
          )}
          {...props}
        />
        {rightIcon != null && (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"
            aria-hidden
          >
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
