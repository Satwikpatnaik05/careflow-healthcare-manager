import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrgencyBadgeProps {
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  showIcon?: boolean;
  className?: string;
}

export function UrgencyBadge({ urgency, showIcon = true, className }: UrgencyBadgeProps) {
  const norm = (urgency || "LOW").toUpperCase();

  if (norm === "CRITICAL" || norm === "HIGH") {
    return (
      <Badge
        variant="rose"
        className={cn("bg-rose-50 text-rose-700 border-rose-200 gap-1.5 font-semibold", className)}
      >
        {showIcon && <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}
        {norm === "CRITICAL" ? "Critical Priority" : "High Urgency"}
      </Badge>
    );
  }

  if (norm === "MEDIUM") {
    return (
      <Badge
        variant="amber"
        className={cn("bg-amber-50 text-amber-800 border-amber-200 gap-1.5 font-semibold", className)}
      >
        {showIcon && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
        Moderate Urgency
      </Badge>
    );
  }

  return (
    <Badge
      variant="emerald"
      className={cn("bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 font-semibold", className)}
    >
      {showIcon && <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />}
      Routine / Low
    </Badge>
  );
}
