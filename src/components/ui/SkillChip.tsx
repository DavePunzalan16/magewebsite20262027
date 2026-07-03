import { cn } from "@/lib/utils";

interface SkillChipProps {
  name: string;
  className?: string;
}

export function SkillChip({ name, className }: SkillChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-dark-gray px-6 py-4 font-body text-[14px] font-bold uppercase text-white transition-colors duration-300 hover:border-primary hover:text-primary md:px-10 md:py-5 md:text-[16px]",
        className
      )}
    >
      {name}
    </span>
  );
}
