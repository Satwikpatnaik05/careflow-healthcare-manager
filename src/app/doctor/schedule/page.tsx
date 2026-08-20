"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export default function DoctorSchedulePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Leave Form
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 2), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"));
  const [reason, setReason] = useState("Medical conference & continuing education");

  useEffect(() => {
    fetchLeaves();
  }, []);

  async function fetchLeaves() {
    setLoading(true);
    try {
      const res = await fetch("/api/leaves");
      const data = await res.json();
      if (data.leaves) setLeaves(data.leaves);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error("Please fill in all leave fields.");
      return;
    }

    setSubmittingLeave(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Leave marked! ${data.affectedAppointmentsCount} conflicting appointment(s) rescheduled and patient alerts dispatched.`
        );
        fetchLeaves();
      } else {
        toast.error(data.error || "Failed to mark leave.");
      }
    } catch {
      toast.error("Network error marking leave.");
    } finally {
      setSubmittingLeave(false);
    }
  }

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule & Leave Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure weekly clinic hours and schedule time off with automatic conflict resolution.
        </p>
      </div>

      {/* Automatic Conflict Notification Notice */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-950">
        <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <strong>Proactive Conflict Resolution:</strong> When you mark leave for a date range with existing bookings, CareFlow automatically updates conflicting bookings to <code>RESCHEDULED</code> and emails affected patients with 1-click priority reschedule links.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Working Hours Display */}
        <Card className="border border-slate-200 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              <span>Weekly Consultation Hours</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {daysOfWeek.map((day, idx) => (
              <div
                key={day}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{day}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                    Active
                  </span>
                </div>
                <div className="text-slate-600 font-medium">
                  09:00 AM - 05:00 PM <span className="text-slate-400 font-normal">(Break: 1-2 PM)</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mark Leave Form */}
        <Card className="border border-slate-200 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Schedule Doctor Leave</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleMarkLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason for Leave</label>
                <Input
                  placeholder="e.g. Annual Leave, Medical Conference, Personal"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                className="w-full text-xs font-semibold mt-2"
                isLoading={submittingLeave}
              >
                Submit Leave & Dispatch Patient Reschedule Alerts
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Existing Leaves List */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-bold text-slate-900">Recorded Leave History</h3>

        {leaves.length > 0 ? (
          <div className="space-y-3">
            {leaves.map((l) => (
              <Card key={l.id} className="border border-slate-200 shadow-card">
                <CardContent className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">
                        {formatDate(l.startDate)} - {formatDate(l.endDate)}
                      </strong>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        {l.status}
                      </span>
                    </div>
                    <p className="text-slate-500">{l.reason}</p>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Logged {formatDate(l.createdAt)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No leaves recorded.</p>
        )}
      </div>
    </div>
  );
}
