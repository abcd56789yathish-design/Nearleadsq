"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketing page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 p-2">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h2 className="mt-4 text-xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An error occurred while loading this page. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          Error ID: {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} size="sm">
          <RefreshCw />
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" size="sm">
            <Home />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
