"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  FileEdit,
  Search,
  Filter,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/utils";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.appointments) setAppointments(data.appointments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = appointments.filter((apt) => {
    if (filterStatus !== "ALL" && apt.status !== filterStatus) return false;
    if (searchQuery) {
      const nameMatch = apt.patient?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const numMatch = apt.appointmentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const complaintMatch = apt.symptomAssessment?.chiefComplaint?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || numMatch || complaintMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments & Triage Registry</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Master registry of all patient visits, triage assessments, and clinical consultation records.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border border-slate-200 shadow-card">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by patient name, appointment #, or symptom complaint..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {(["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterStatus === tab
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab === "ALL" && "All Statuses"}
                  {tab === "CONFIRMED" && "Upcoming"}
                  {tab === "COMPLETED" && "Completed"}
                  {tab === "CANCELLED" && "Cancelled / Rescheduled"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <Card key={apt.id} className="border border-slate-200 shadow-card hover:border-teal-200 transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar src={apt.patient?.user?.avatarUrl} name={apt.patient?.user?.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{apt.patient?.user?.name}</h4>
                        <StatusBadge status={apt.status} />
                        {apt.symptomAssessment && (
                          <UrgencyBadge urgency={apt.symptomAssessment.urgencyLevel} />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {apt.appointmentNumber} • {formatDateTime(apt.startTime)}
                      </p>
                      {apt.symptomAssessment && (
                        <p className="text-xs text-slate-700 mt-1 font-medium line-clamp-1">
                          <strong>Chief Complaint:</strong> {apt.symptomAssessment.chiefComplaint}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link href={`/doctor/consult/${apt.id}`}>
                    <Button variant="default" size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>{apt.status === "COMPLETED" ? "Review Record" : "Consultation Room"}</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No Appointments Found"
          description="There are no consultations matching your selected filter criteria."
        />
      )}
    </div>
  );
}
