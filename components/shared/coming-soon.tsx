import { type LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="bg-muted flex size-11 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-5" strokeWidth={1.5} />
      </div>
      <h2 className="font-serif text-xl italic">{title}</h2>
      <p className="text-muted-foreground max-w-sm text-sm text-balance">
        {description}
      </p>
    </div>
  );
}
