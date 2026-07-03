import { cn } from "@/lib/utils";

interface SectionDividerProps {
  className?: string;
  withFog?: boolean;
}

export function SectionDivider({ className, withFog = false }: SectionDividerProps) {
  return (
    <div className={cn("relative", className)}>
      {withFog && (
        <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      )}
      <hr className="w-full border-t border-dark-gray/20" aria-hidden="true" />
    </div>
  );
}
