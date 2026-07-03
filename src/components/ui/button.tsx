import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full font-body font-bold text-[16px] uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-black hover:bg-primary/90",
        social: "bg-icon-bg text-white hover:bg-icon-bg/80",
        outline:
          "border border-dark-gray bg-transparent text-white hover:border-primary hover:text-primary",
      },
      size: {
        default: "h-[54px] px-6 py-5",
        icon: "h-[54px] w-[54px]",
        lg: "h-[54px] px-10 py-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  withArrow?: boolean;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, withArrow, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <span>{children}</span>
        {withArrow && (
          <span className="ml-3 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-black/20">
            <ArrowRight className="h-5 w-5" />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
