"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-xl bg-destructive/10 p-2">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-8">
        <RefreshCw />
        Try again
      </Button>
    </div>
  );
}
