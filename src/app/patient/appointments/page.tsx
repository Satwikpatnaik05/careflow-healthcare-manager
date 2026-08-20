"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileText,
  Pill,
  Download,
  AlertTriangle,
  Stethoscope,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateTime, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface AppointmentItem {
  id: string;
  appointmentNumber: string;
  startTime: string;
  endTime: string;
  status: string;
  cancellationReason: string | null;
  doctor: {
    user: {
      name: string;
      email: string;
      avatarUrl: string | null;
    };
    specialization: {
      name: string;
    };
  };
  symptomAssessment: {
    rawSymptoms: string;
    duration: string | null;
    painScale: number | null;
    urgencyLevel: string;
    chiefComplaint: string;
    suggestedQuestions: string; // JSON string
  } | null;
  consultationRecord: {
    diagnosis: string;
    clinicalNotes: string;
    patientFriendlySummary: string;
    followUpSteps: string | null;
    prescriptions: {
      id: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      timing: string | null;
      instructions: string | null;
    }[];
  } | null;
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("ALL");

  // Modal inspection state
  const [selectedApt, setSelectedApt] = useState<AppointmentItem | null>(null);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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

  async function handleCancelAppointment() {
    if (!cancellingId) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/appointments/${cancellingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancellationReason: "Cancelled by patient via online portal",
        }),
      });

      if (res.ok) {
        toast.success("Appointment cancelled successfully.");
        setCancelModalOpen(false);
        fetchAppointments();
        if (selectedApt?.id === cancellingId) setSelectedApt(null);
      } else {
        toast.error("Failed to cancel appointment.");
      }
    } catch {
      toast.error("Error during cancellation.");
    } finally {
      setCancelLoading(false);
    }
  }

  const filtered = appointments.filter((apt) => {
    if (filterTab === "ALL") return true;
    if (filterTab === "CONFIRMED") return apt.status === "CONFIRMED";
    if (filterTab === "COMPLETED") return apt.status === "COMPLETED";
    if (filterTab === "CANCELLED") return apt.status === "CANCELLED" || apt.status === "RESCHEDULED";
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Consultations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            View upcoming bookings, AI pre-visit assessments, and physician follow-up care plans.
          </p>
        </div>

        <Link href="/patient/doctors">
          <Button variant="default" className="font-semibold text-xs gap-1.5 shadow-sm">
            <Stethoscope className="h-4 w-4" />
            <span>Book New Appointment</span>
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterTab === tab
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab === "ALL" && "All Consultations"}
            {tab === "CONFIRMED" && "Upcoming"}
            {tab === "COMPLETED" && "Completed"}
            {tab === "CANCELLED" && "Cancelled / Rescheduled"}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((apt) => (
            <Card
              key={apt.id}
              className="border border-slate-200/90 shadow-card hover:border-teal-200 transition-all overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={apt.doctor.user.avatarUrl}
                      name={apt.doctor.user.name}
                      size="lg"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">
                          Dr. {apt.doctor.user.name}
                        </h3>
                        <StatusBadge status={apt.status} />
                        {apt.symptomAssessment && (
                          <UrgencyBadge urgency={apt.symptomAssessment.urgencyLevel} />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-teal-700 mt-0.5">
                        {apt.doctor.specialization.name} • {apt.appointmentNumber}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDateTime(apt.startTime)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <a
                      href={`/api/calendar/ics/${apt.id}`}
                      download
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5"
                      title="Download .ics Calendar File"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">iCal</span>
                    </a>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApt(apt)}
                      className="text-xs font-semibold gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-teal-600" />
                      <span>View Records & AI Care Plan</span>
                    </Button>

                    {apt.status === "CONFIRMED" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setCancellingId(apt.id);
                          setCancelModalOpen(true);
                        }}
                        className="text-xs font-semibold"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Symptom Complaint Preview Banner */}
                {apt.symptomAssessment && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium truncate max-w-xl">
                      <strong>Chief Complaint:</strong> {apt.symptomAssessment.chiefComplaint}
                    </span>
                    {apt.consultationRecord && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px]">
                        Post-Visit Care Plan Ready
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No Consultations Found"
          description="You do not have any consultations matching the selected filter."
          actionLabel="Book a Specialist"
          actionHref="/patient/doctors"
        />
      )}

      {/* FULL APPOINTMENT & AI CARE PLAN MODAL */}
      {selectedApt && (
        <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
          <DialogContent onClose={() => setSelectedApt(null)} className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle>Consultation Record: {selectedApt.appointmentNumber}</DialogTitle>
                  <DialogDescription>
                    Dr. {selectedApt.doctor.user.name} ({selectedApt.doctor.specialization.name}) • {formatDateTime(selectedApt.startTime)}
                  </DialogDescription>
                </div>
                <StatusBadge status={selectedApt.status} />
              </div>
            </DialogHeader>

            <div className="space-y-6 text-xs mt-4">
              {/* Pre-visit AI Triage Record */}
              {selectedApt.symptomAssessment && (
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-teal-900">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      <span>Pre-Visit Clinical Intake</span>
                    </div>
                    <UrgencyBadge urgency={selectedApt.symptomAssessment.urgencyLevel} />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Patient Symptoms</span>
                    <p className="text-slate-800 mt-0.5">{selectedApt.symptomAssessment.rawSymptoms}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Duration</span>
                      <p className="font-semibold text-slate-800">{selectedApt.symptomAssessment.duration || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pain Scale</span>
                      <p className="font-semibold text-slate-800">{selectedApt.symptomAssessment.painScale || "N/A"}/10</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Post-Visit Clinical Summary */}
              {selectedApt.consultationRecord ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <FileText className="h-4 w-4 text-teal-600" />
                      <span>Diagnosis: {selectedApt.consultationRecord.diagnosis}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Doctor&apos;s Plain-English Care Summary
                      </span>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {selectedApt.consultationRecord.patientFriendlySummary}
                      </p>
                    </div>

                    {selectedApt.consultationRecord.followUpSteps && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Follow-up & Self-Care Steps
                        </span>
                        <p className="text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {selectedApt.consultationRecord.followUpSteps}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prescribed Medications */}
                  {selectedApt.consultationRecord.prescriptions?.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <Pill className="h-4 w-4 text-teal-600" />
                        <span>Prescribed Medications</span>
                      </div>

                      <div className="space-y-2">
                        {selectedApt.consultationRecord.prescriptions.map((rx) => (
                          <div key={rx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{rx.medicationName}</strong> ({rx.dosage})
                              <p className="text-[11px] text-slate-500 mt-0.5">{rx.instructions || rx.timing}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold uppercase">
                              {rx.frequency.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 italic">
                  Clinical consultation record will be published here once Dr. {selectedApt.doctor.user.name} completes the visit.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel Appointment?"
        description="Are you sure you want to cancel this consultation? Your physician will be notified immediately."
        confirmLabel="Cancel Appointment"
        isLoading={cancelLoading}
        onConfirm={handleCancelAppointment}
      />
    </div>
  );
}
