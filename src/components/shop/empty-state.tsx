import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-24 text-center",
        className,
      )}
    >
      <p className="font-serif text-xl text-neutral-900">{title}</p>
      {description && <p className="text-sm text-neutral-500">{description}</p>}
    </div>
  );
}
