import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "font-display text-[40px] leading-[1.0] text-white md:text-[56px] lg:text-[76px]",
        className
      )}
    >
      {children}
    </h2>
  );
}
