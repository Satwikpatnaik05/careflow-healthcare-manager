"use client";

import React, { useState, useEffect } from "react";
import { Bell, Calendar, RefreshCw, Sparkles, Menu, X, Check, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
}

export function TopBar({ user }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calConnected, setCalConnected] = useState(false);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [calLoading, setCalLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check Google Calendar connection status
    fetch("/api/calendar/google")
      .then((r) => r.json())
      .then((d) => setCalConnected(d.isConnected))
      .catch(() => {});
  }, []);

  async function handleToggleGoogleCalendar() {
    setCalLoading(true);
    try {
      const res = await fetch("/api/calendar/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setCalConnected(data.isConnected);
        toast.success(data.message || (data.isConnected ? "Google Calendar Connected!" : "Google Calendar Disconnected."));
      } else {
        toast.error("Failed to update Google Calendar sync.");
      }
    } catch {
      toast.error("Error updating calendar connection.");
    } finally {
      setCalLoading(false);
    }
  }

  async function handleRunCron() {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cron/reminders");
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Scheduler sweep executed: ${data.stats.medicationRemindersProcessed} med reminders sent, ${data.stats.appointmentRemindersProcessed} appointment alerts sent.`
        );
      } else {
        toast.error("Scheduler run failed.");
      }
    } catch {
      toast.error("Failed to run cron scheduler.");
    } finally {
      setIsSyncing(false);
    }
  }

  const role = user?.role || "PATIENT";

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div>
          <h1 className="text-base font-semibold text-slate-900 capitalize leading-tight">
            {pathname === "/patient" && "Patient Dashboard"}
            {pathname.startsWith("/patient/doctors") && "Specialist Directory"}
            {pathname.startsWith("/patient/book") && "Book Clinical Consultation"}
            {pathname.startsWith("/patient/appointments") && "My Consultations & History"}
            {pathname.startsWith("/patient/medications") && "Medications & Reminders"}
            {pathname === "/doctor" && "Doctor Clinical Schedule"}
            {pathname.startsWith("/doctor/appointments") && "Appointments & AI Triage"}
            {pathname.startsWith("/doctor/consult") && "Consultation & Prescription Room"}
            {pathname.startsWith("/doctor/schedule") && "Hours & Leave Management"}
            {pathname === "/admin" && "Executive Clinic Operations"}
            {pathname.startsWith("/admin/doctors") && "Physician Staff Directory"}
            {pathname.startsWith("/admin/leaves") && "Leave Conflict Resolution"}
            {pathname.startsWith("/admin/notifications") && "Notification Dispatch Audit"}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            CareFlow Health Management System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Run Background Scheduler Sweep Button */}
        <Button
          onClick={handleRunCron}
          variant="outline"
          size="sm"
          isLoading={isSyncing}
          className="hidden sm:flex text-xs h-8 gap-1.5 border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200"
          title="Manually trigger reminder cron sweep and prune expired slot holds"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-teal-600 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Run Cron Sweep</span>
        </Button>

        {/* Google Calendar Sync Button & Modal */}
        <button
          type="button"
          onClick={() => setCalModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            calConnected
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-teal-50 hover:text-teal-800"
          }`}
          title="Google Calendar Integration Settings"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {calConnected ? "Google Cal Synced" : "Connect Google Cal"}
          </span>
          {calConnected && <Check className="h-3 w-3 text-emerald-600" />}
        </button>

        {/* User Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="hidden lg:block text-left">
              <span className="text-xs font-semibold text-slate-800 block leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-none">
                {user.email}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white border-b border-slate-200 p-4 shadow-floating z-50 animate-fade-in">
          <nav className="space-y-2">
            {role === "PATIENT" && (
              <>
                <Link
                  href="/patient"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Overview
                </Link>
                <Link
                  href="/patient/doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Find a Doctor
                </Link>
                <Link
                  href="/patient/appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  My Appointments
                </Link>
                <Link
                  href="/patient/medications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Medications
                </Link>
              </>
            )}

            {role === "DOCTOR" && (
              <>
                <Link
                  href="/doctor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Today&apos;s Schedule
                </Link>
                <Link
                  href="/doctor/appointments"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Appointments & Triage
                </Link>
                <Link
                  href="/doctor/schedule"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Schedule & Leaves
                </Link>
              </>
            )}

            {role === "ADMIN" && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Executive Dashboard
                </Link>
                <Link
                  href="/admin/doctors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Doctor Management
                </Link>
                <Link
                  href="/admin/leaves"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Leaves & Conflicts
                </Link>
                <Link
                  href="/admin/notifications"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Notification Logs
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Interactive Google Calendar Integration Modal */}
      <Dialog open={calModalOpen} onOpenChange={setCalModalOpen}>
        <DialogContent onClose={() => setCalModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Google Calendar Integration</DialogTitle>
                <DialogDescription>
                  Sync your clinical appointments automatically with Google Calendar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block text-sm">Sync Status</span>
                <span className="text-slate-500">
                  {calConnected ? "Connected & Synchronized" : "Not Connected"}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  calConnected
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {calConnected ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-100 text-teal-900 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span>Automatic 2-Way Calendar Invites</span>
              </div>
              <p className="text-[11px] text-slate-600">
                When enabled, booked consultations are automatically synced to your calendar with physician details, reminder alerts, and consultation notes.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              variant={calConnected ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleGoogleCalendar}
              isLoading={calLoading}
              className="text-xs font-semibold"
            >
              {calConnected ? "Disconnect Google Calendar" : "1-Click Connect Google Calendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
