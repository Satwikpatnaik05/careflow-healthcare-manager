import React from "react";
import Link from "next/link";
import { LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 my-4",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card border border-slate-100 text-teal-600 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="default" size="sm" className="font-semibold text-xs shadow-sm">
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && !actionHref && onAction && (
        <Button onClick={onAction} variant="default" size="sm" className="font-semibold text-xs shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
