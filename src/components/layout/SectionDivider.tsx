import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <hr
      className={cn("w-full border-t border-dark-gray", className)}
      aria-hidden="true"
    />
  );
}
