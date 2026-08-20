"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 2), "yyyy-MM-dd"));
  const [reason, setReason] = useState("Hospital Clinical Board Meeting");

  useEffect(() => {
    fetchLeaves();
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      if (data.doctors) {
        setDoctors(data.doctors);
        if (data.doctors.length > 0) setSelectedDoctorId(data.doctors[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

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

  async function handleCreateLeave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctorId || !startDate || !endDate || !reason) {
      toast.error("Please fill all leave fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          startDate: `${startDate}T00:00:00.000Z`,
          endDate: `${endDate}T23:59:59.999Z`,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Doctor leave logged. ${data.affectedAppointmentsCount} conflicting appointment(s) updated to RESCHEDULED with automated patient email alerts.`
        );
        fetchLeaves();
      } else {
        toast.error(data.error || "Failed to log leave.");
      }
    } catch {
      toast.error("Network error logging leave.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Doctor Leave & Conflict Resolution Center
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Schedule physician absences and automatically resolve booking collisions with instant patient notifications.
        </p>
      </div>

      {/* System guarantee callout */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-950">
        <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <strong>System-wide Invariant:</strong> When a physician is approved on leave for a timeframe with existing bookings, the database transaction instantly cancels/reschedules all overlapping appointments and emails affected patients with immediate reschedule links.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Leave Form (1 col) */}
        <Card className="border border-slate-200 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Record Doctor Leave</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:border-teal-600"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user?.name} ({d.specialization?.name})
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reason</label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Clinical Leave, Sabbatical"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="destructive"
                className="w-full text-xs font-semibold mt-2"
                isLoading={submitting}
              >
                Log Leave & Dispatch Patient Reschedule Alerts
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Leaves Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Active & Logged Staff Leaves</h3>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : leaves.length > 0 ? (
            <div className="space-y-3">
              {leaves.map((l) => (
                <Card key={l.id} className="border border-slate-200 shadow-card hover:border-teal-200 transition-all">
                  <CardContent className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 text-sm">
                          Dr. {l.doctor?.user?.name}
                        </strong>
                        <span className="text-[11px] text-teal-700 font-semibold">
                          ({l.doctor?.specialization?.name})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                          {l.status}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        <strong>Dates:</strong> {formatDate(l.startDate)} to {formatDate(l.endDate)}
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        <strong>Reason:</strong> {l.reason}
                      </p>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Logged {formatDate(l.createdAt)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No leaves currently recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
