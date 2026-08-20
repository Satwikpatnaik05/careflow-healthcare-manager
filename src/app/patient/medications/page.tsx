"use client";

import React, { useState, useEffect } from "react";
import { Pill, CheckCircle2, Clock, Calendar, AlertCircle, Sparkles, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface PrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  timing: string | null;
  durationDays: number;
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  appointment: {
    doctor: {
      user: { name: string };
      specialization: { name: string };
    };
  };
  reminders: {
    id: string;
    scheduledTime: string;
    status: string;
  }[];
}

export default function PatientMedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    setLoading(true);
    try {
      const res = await fetch("/api/medications");
      const data = await res.json();
      if (data.prescriptions) setPrescriptions(data.prescriptions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkTaken(reminderId: string) {
    setMarkingId(reminderId);
    try {
      const res = await fetch("/api/medications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId, status: "ACKNOWLEDGED" }),
      });

      if (res.ok) {
        toast.success("Medication dose logged as taken!");
        fetchMedications();
      } else {
        toast.error("Failed to update reminder.");
      }
    } catch {
      toast.error("Error updating dose status.");
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Medications & Care Schedule</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Track your active prescriptions and daily scheduled intake reminders.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-900">
        <Sparkles className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <strong>Automated Clinical Reminders Active:</strong> The CareFlow background scheduler automatically dispatches email reminders according to each medication&apos;s prescribed frequency.
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prescriptions.map((rx) => (
            <Card
              key={rx.id}
              className="border border-slate-200 shadow-card hover:border-teal-200 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{rx.medicationName}</h3>
                      <span className="text-xs font-semibold text-teal-700">{rx.dosage}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                    {rx.frequency.replace("_", " ")}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p>
                    <strong>Timing:</strong> {rx.timing || "Follow physician advice"}
                  </p>
                  <p>
                    <strong>Prescribing Doctor:</strong> Dr. {rx.appointment.doctor.user.name} ({rx.appointment.doctor.specialization.name})
                  </p>
                  {rx.instructions && (
                    <p className="italic text-slate-500 pt-1 border-t border-slate-200/60">
                      &quot;{rx.instructions}&quot;
                    </p>
                  )}
                </div>

                {/* Reminders Pill Box */}
                {rx.reminders?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                      Upcoming Dose Schedule
                    </span>
                    <div className="space-y-2">
                      {rx.reminders.slice(0, 3).map((rem) => {
                        const isTaken = rem.status === "ACKNOWLEDGED";
                        return (
                          <div
                            key={rem.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                              isTaken
                                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                                : "bg-white border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className={`h-3.5 w-3.5 ${isTaken ? "text-emerald-600" : "text-slate-400"}`} />
                              <span>{formatDateTime(rem.scheduledTime)}</span>
                            </div>

                            {isTaken ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <Check className="h-3.5 w-3.5" /> Taken
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkTaken(rem.id)}
                                isLoading={markingId === rem.id}
                                className="h-7 px-2.5 text-[11px] font-semibold border-teal-200 text-teal-800 hover:bg-teal-50"
                              >
                                Mark Taken
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Pill}
          title="No Prescriptions on File"
          description="Any medications and treatment schedules prescribed by your doctors will appear here."
        />
      )}
    </div>
  );
}
