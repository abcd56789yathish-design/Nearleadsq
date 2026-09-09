"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 p-2">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight">Authentication error</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        There was a problem with authentication. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          Error ID: {error.digest}
        </p>
      )}
      <Button onClick={reset} className="mt-6" size="sm">
        <RefreshCw />
        Try again
      </Button>
    </div>
  );
}
