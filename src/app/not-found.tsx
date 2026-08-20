import React from "react";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 mx-auto mb-4">
          <FileQuestion className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The page or resource you are looking for does not exist or has been moved.
        </p>

        <Link href="/">
          <Button variant="default" size="sm" className="gap-1.5">
            <Home className="h-4 w-4" />
            <span>Return to Homepage</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
