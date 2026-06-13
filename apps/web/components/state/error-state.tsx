import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "The request could not be completed.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("rounded-lg border border-destructive/30 bg-destructive/5 p-5", className)}>
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 text-destructive" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {onRetry ? (
            <Button className="mt-4" variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
