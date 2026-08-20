import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-teal-600 text-white shadow-sm",
        secondary: "border-transparent bg-slate-100 text-slate-900",
        destructive: "border-transparent bg-rose-600 text-white shadow-sm",
        outline: "text-slate-800 border-slate-200",
        teal: "bg-teal-50 text-teal-800 border-teal-200/60",
        emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
        amber: "bg-amber-50 text-amber-800 border-amber-200/60",
        rose: "bg-rose-50 text-rose-800 border-rose-200/60",
        indigo: "bg-indigo-50 text-indigo-800 border-indigo-200/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
