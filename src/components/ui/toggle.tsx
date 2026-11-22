import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cn } from "@/lib/utils";

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex h-8 w-12 items-center rounded-full border-2 border-transparent transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=on]:bg-accent data-[state=off]:bg-surface-2",
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        "block h-5 w-5 rounded-full bg-surface shadow ring-0 transition-transform",
        "data-[state=on]:translate-x-5 data-[state=off]:translate-x-0.5",
      )}
    />
  </TogglePrimitive.Root>
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle };
