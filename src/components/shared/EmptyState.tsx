import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted-fg">{icon}</div>}
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && <p className="max-w-sm text-sm text-muted-fg">{description}</p>}
      </div>
      {action}
    </div>
  );
}
