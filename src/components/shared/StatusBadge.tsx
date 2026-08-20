import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "PENDING" | "NO_SHOW" | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const norm = (status || "CONFIRMED").toUpperCase();

  switch (norm) {
    case "CONFIRMED":
      return (
        <Badge
          variant="teal"
          className={cn("bg-teal-50 text-teal-800 border-teal-200 gap-1 font-medium", className)}
        >
          <CheckCircle2 className="h-3 w-3 text-teal-600" />
          Confirmed
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          variant="indigo"
          className={cn("bg-indigo-50 text-indigo-800 border-indigo-200 gap-1 font-medium", className)}
        >
          <CheckCircle2 className="h-3 w-3 text-indigo-600" />
          Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="rose"
          className={cn("bg-rose-50 text-rose-700 border-rose-200 gap-1 font-medium", className)}
        >
          <XCircle className="h-3 w-3 text-rose-600" />
          Cancelled
        </Badge>
      );
    case "RESCHEDULED":
      return (
        <Badge
          variant="amber"
          className={cn("bg-amber-50 text-amber-800 border-amber-200 gap-1 font-medium", className)}
        >
          <RotateCcw className="h-3 w-3 text-amber-600" />
          Rescheduled (Leave)
        </Badge>
      );
    default:
      return (
        <Badge
          variant="secondary"
          className={cn("bg-slate-100 text-slate-700 border-slate-200 gap-1 font-medium", className)}
        >
          <Clock className="h-3 w-3 text-slate-500" />
          {status}
        </Badge>
      );
  }
}
