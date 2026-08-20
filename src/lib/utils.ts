import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "MMM d, yyyy");
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: Date | string): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return String(date);
  }
}

export function formatTime(date: Date | string): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "h:mm a");
  } catch {
    return String(date);
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getInitials(name: string): string {
  if (!name) return "DR";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDoctorName(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed.startsWith("Dr.") || trimmed.startsWith("Dr ")) {
    return trimmed;
  }
  return `Dr. ${trimmed}`;
}

