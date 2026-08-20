"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Runtime App Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mx-auto mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 mb-6">
          {error?.message || "An unexpected error occurred while loading this page."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="default" size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
