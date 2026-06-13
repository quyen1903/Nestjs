import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({ label = "Loading", className }: LoadingStateProps) {
  return (
    <div className={cn("grid min-h-52 place-items-center rounded-lg border bg-background p-8", className)}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-3 animate-pulse rounded-full bg-primary" />
        {label}
      </div>
    </div>
  );
}
