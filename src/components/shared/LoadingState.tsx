import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-muted-fg", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function FullPageLoading({ label = "Loading THREADLAB" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-fg">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-display text-lg font-bold text-accent-fg">
        T
      </span>
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
