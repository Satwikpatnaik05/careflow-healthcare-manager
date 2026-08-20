"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Activity,
  FileText,
  AlertTriangle,
  User,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface PrescriptionItemInput {
  medicationName: string;
  dosage: string;
  frequency: string;
  timing: string;
  durationDays: number;
  instructions: string;
}

export default function DoctorConsultationRoomPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [bp, setBp] = useState("120/80");
  const [hr, setHr] = useState("72");
  const [temp, setTemp] = useState("98.6°F");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItemInput[]>([
    {
      medicationName: "",
      dosage: "",
      frequency: "TWICE_DAILY",
      timing: "After meals",
      durationDays: 5,
      instructions: "",
    },
  ]);

  // AI Generated Result State
  const [completedRecord, setCompletedRecord] = useState<any>(null);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  async function fetchAppointment() {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      const data = await res.json();
      if (data.appointment) {
        setAppointment(data.appointment);
        if (data.appointment.consultationRecord) {
          setDiagnosis(data.appointment.consultationRecord.diagnosis || "");
          setClinicalNotes(data.appointment.consultationRecord.clinicalNotes || "");
          setCompletedRecord(data.appointment.consultationRecord);

          if (data.appointment.consultationRecord.prescriptions?.length > 0) {
            setPrescriptions(
              data.appointment.consultationRecord.prescriptions.map((rx: any) => ({
                medicationName: rx.medicationName,
                dosage: rx.dosage,
                frequency: rx.frequency,
                timing: rx.timing || "",
                durationDays: rx.durationDays,
                instructions: rx.instructions || "",
              }))
            );
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleAddPrescription() {
    setPrescriptions([
      ...prescriptions,
      {
        medicationName: "",
        dosage: "",
        frequency: "ONCE_DAILY",
        timing: "Morning with water",
        durationDays: 7,
        instructions: "",
      },
    ]);
  }

  function handleRemovePrescription(index: number) {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  }

  function handlePrescriptionChange(index: number, field: keyof PrescriptionItemInput, value: any) {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  }

  async function handleSubmitConsultation(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis.trim() || !clinicalNotes.trim()) {
      toast.error("Please provide both Diagnosis and Clinical Notes.");
      return;
    }

    setSubmitting(true);
    try {
      const validPrescriptions = prescriptions.filter(
        (p) => p.medicationName.trim() && p.dosage.trim()
      );

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          diagnosis,
          clinicalNotes,
          vitalSigns: { bp, hr, temp },
          prescriptions: validPrescriptions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Consultation saved! AI patient care plan generated and emailed.");
        setCompletedRecord(data.consultation);
        fetchAppointment();
      } else {
        toast.error(data.error || "Failed to submit consultation.");
      }
    } catch {
      toast.error("Network error submitting consultation.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-8">
        <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!appointment) return null;

  const suggestedQuestions = appointment.symptomAssessment?.suggestedQuestions
    ? JSON.parse(appointment.symptomAssessment.suggestedQuestions)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Top Breadcrumb */}
      <Link
        href="/doctor"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Schedule Queue</span>
      </Link>

      {/* Patient Vitals & Demographics Card */}
      <Card className="border border-slate-200 shadow-card bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar
                src={appointment.patient?.user?.avatarUrl}
                name={appointment.patient?.user?.name}
                size="lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {appointment.patient?.user?.name}
                  </h2>
                  <StatusBadge status={appointment.status} />
                  {appointment.symptomAssessment && (
                    <UrgencyBadge urgency={appointment.symptomAssessment.urgencyLevel} />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Appt #{appointment.appointmentNumber} • {appointment.patient?.gender || "Patient"} • Blood Group: {appointment.patient?.bloodGroup || "Unknown"}
                </p>
                <p className="text-xs text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Scheduled: {formatDateTime(appointment.startTime)}</span>
                </p>
              </div>
            </div>

            {/* Medical History Alert */}
            {appointment.patient?.medicalHistory && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 max-w-sm">
                <span className="font-bold block uppercase text-[10px] text-amber-800">
                  Known Medical History / Allergies:
                </span>
                <p className="mt-0.5">{appointment.patient.medicalHistory}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pre-Visit AI Triage Review Banner */}
      {appointment.symptomAssessment && (
        <Card className="border border-teal-200 bg-gradient-to-br from-teal-50/70 via-white to-white shadow-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-teal-950">Pre-Visit AI Symptom Triage</h3>
                  <span className="text-[10px] text-teal-700">
                    Generated via {appointment.symptomAssessment.llmModelUsed || "Clinical Heuristic Engine"}
                  </span>
                </div>
              </div>
              <UrgencyBadge urgency={appointment.symptomAssessment.urgencyLevel} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Chief Complaint</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">
                  {appointment.symptomAssessment.chiefComplaint}
                </p>
                <p className="text-slate-600 italic mt-1 bg-white/80 p-2.5 rounded-lg border border-teal-100">
                  &quot;{appointment.symptomAssessment.rawSymptoms}&quot;
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  AI Suggested Diagnostic Inquiries
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 bg-white/80 p-3 rounded-lg border border-teal-100">
                  {suggestedQuestions.map((q: string, i: number) => (
                    <li key={i} className="leading-snug">{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Notes & Diagnosis Form */}
      <form onSubmit={handleSubmitConsultation} className="space-y-6">
        <Card className="border border-slate-200 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              <span>Physician Examination & Clinical Notes</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Vitals inputs */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Blood Pressure</label>
                <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80 mmHg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Heart Rate</label>
                <Input value={hr} onChange={(e) => setHr(e.target.value)} placeholder="72 bpm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Body Temp</label>
                <Input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="98.6°F" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Diagnosis / Clinical Finding *</label>
              <Input
                placeholder="e.g. Acute Allergic Contact Dermatitis / Essential Hypertension"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>Physician Notes (Raw Clinical Findings) *</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Will be translated into patient-friendly language by LLM
                </span>
              </label>
              <Textarea
                placeholder="Enter physical examination observations, auscultation results, recommended diagnostic follow-up, and home care instructions..."
                className="min-h-[120px]"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Prescription Builder */}
        <Card className="border border-slate-200 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-600" />
              <span>Prescription & Medication Adherence Schedule</span>
            </CardTitle>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPrescription}
              className="text-xs font-semibold gap-1 border-teal-200 text-teal-800 hover:bg-teal-50"
            >
              <Plus className="h-3.5 w-3.5 text-teal-600" />
              <span>Add Medication</span>
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {prescriptions.map((rx, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">
                    Medication #{idx + 1}
                  </span>
                  {prescriptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePrescription(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Medication Name *</label>
                    <Input
                      placeholder="e.g. Amoxicillin / Hydrocortisone"
                      value={rx.medicationName}
                      onChange={(e) => handlePrescriptionChange(idx, "medicationName", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Dosage *</label>
                    <Input
                      placeholder="e.g. 500mg / 1% Cream"
                      value={rx.dosage}
                      onChange={(e) => handlePrescriptionChange(idx, "dosage", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Frequency</label>
                    <select
                      value={rx.frequency}
                      onChange={(e) => handlePrescriptionChange(idx, "frequency", e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:border-teal-600"
                    >
                      <option value="ONCE_DAILY">Once Daily</option>
                      <option value="TWICE_DAILY">Twice Daily (Morning/Night)</option>
                      <option value="THREE_TIMES_DAILY">Three Times Daily</option>
                      <option value="EVERY_8_HOURS">Every 8 Hours</option>
                      <option value="AS_NEEDED">As Needed (PRN)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Timing & Instructions</label>
                    <Input
                      placeholder="e.g. Take after breakfast with water"
                      value={rx.timing}
                      onChange={(e) => handlePrescriptionChange(idx, "timing", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">Duration (Days)</label>
                    <Input
                      type="number"
                      min="1"
                      max="90"
                      value={rx.durationDays}
                      onChange={(e) => handlePrescriptionChange(idx, "durationDays", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/doctor">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>

          <Button
            type="submit"
            variant="default"
            size="lg"
            isLoading={submitting}
            className="font-bold text-xs gap-2 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Complete Visit & Generate AI Patient Summary</span>
          </Button>
        </div>
      </form>

      {/* Live AI Patient Summary Inspection Box (when completed) */}
      {completedRecord && (
        <Card className="border border-emerald-200 bg-emerald-50/50 shadow-card animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-bold text-emerald-950">
                AI Patient-Friendly Care Plan Successfully Dispatched
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-white border border-emerald-200/60 space-y-2">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Plain English Summary:</span>
              <p className="text-slate-700 leading-relaxed">{completedRecord.patientFriendlySummary}</p>
            </div>
            {completedRecord.followUpSteps && (
              <div className="p-4 rounded-xl bg-white border border-emerald-200/60 space-y-2">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Follow-up Instructions:</span>
                <p className="text-slate-700 whitespace-pre-line">{completedRecord.followUpSteps}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
