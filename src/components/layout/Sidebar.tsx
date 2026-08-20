"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Clock,
  Pill,
  UserCheck,
  ShieldAlert,
  LogOut,
  Stethoscope,
  Activity,
  CalendarCheck,
  Mail,
  Home,
  HeartPulse,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";

interface SidebarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed.");
    }
  }

  const role = user?.role || "PATIENT";

  const patientNav = [
    { name: "Overview", href: "/patient", icon: Home },
    { name: "Find a Doctor", href: "/patient/doctors", icon: Stethoscope },
    { name: "My Appointments", href: "/patient/appointments", icon: CalendarCheck },
    { name: "Medications", href: "/patient/medications", icon: Pill },
  ];

  const doctorNav = [
    { name: "Today's Schedule", href: "/doctor", icon: Calendar },
    { name: "Appointments & Triage", href: "/doctor/appointments", icon: Activity },
    { name: "Schedule & Leaves", href: "/doctor/schedule", icon: Clock },
  ];

  const adminNav = [
    { name: "Executive Dashboard", href: "/admin", icon: Home },
    { name: "Doctor Management", href: "/admin/doctors", icon: UserCheck },
    { name: "Leaves & Conflicts", href: "/admin/leaves", icon: ShieldAlert },
    { name: "Notification Logs", href: "/admin/notifications", icon: Mail },
  ];

  const navItems =
    role === "ADMIN"
      ? adminNav
      : role === "DOCTOR"
      ? doctorNav
      : patientNav;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white min-h-screen flex flex-col justify-between hidden md:flex">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base tracking-tight leading-none block">
              CareFlow
            </span>
            <span className="text-[11px] text-teal-700 font-medium tracking-wide">
              CLINICAL SUITE
            </span>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {user.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full ${
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-700"
                      : user.role === "DOCTOR"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="px-3 py-2">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/patient" && item.href !== "/doctor" && item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-50 text-teal-900 font-semibold shadow-xs border border-teal-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-teal-600" : "text-slate-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
