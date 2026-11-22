import { AlertTriangle } from "lucide-react";
import { useBackendOnline } from "@/app/providers/ConvexProvider";

/**
 * Shown when the app runs without a Convex deployment. Persistence then lives
 * in the browser only — the Convex backend code is complete and activates
 * automatically once CONVEX_URL is configured.
 */
export function OfflineBanner() {
  const online = useBackendOnline();
  if (online) return null;

  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        Offline mode — no Convex deployment configured. Designs save locally in this browser. Set{" "}
        <code className="rounded bg-warning/15 px-1 py-0.5 font-mono">CONVEX_URL</code> and run{" "}
        <code className="rounded bg-warning/15 px-1 py-0.5 font-mono">npx convex dev</code> for cloud
        persistence.
      </span>
    </div>
  );
}
