"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  AlertCircle,
  Stethoscope,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
  timeDisplay: string;
  isAvailable: boolean;
  heldByCurrentPatient?: boolean;
}

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [doctor, setDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 2: Symptom Intake State
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("3 days");
  const [painScale, setPainScale] = useState(3);
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  // Step 3: Confirmation Result
  const [bookedResult, setBookedResult] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [holdTimer, setHoldTimer] = useState<number>(600); // 10 minutes in seconds

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [doctorId, selectedDate]);

  // Hold Countdown Timer
  useEffect(() => {
    if (step === 2 && holdTimer > 0) {
      const interval = setInterval(() => {
        setHoldTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, holdTimer]);

  async function fetchDoctor() {
    try {
      const res = await fetch(`/api/doctors/${doctorId}`);
      const data = await res.json();
      if (data.doctor) setDoctor(data.doctor);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchSlots(dateStr: string) {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/slots?doctorId=${doctorId}&date=${dateStr}`);
      const data = await res.json();
      if (data.slots) setSlots(data.slots);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSelectSlot(slot: TimeSlot) {
    if (!slot.isAvailable) return;

    try {
      const res = await fetch("/api/slots/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedSlot(slot);
        setHoldTimer(600); // Reset 10-minute timer
        setStep(2);
        toast.success("Slot secured for 10 minutes while you complete intake.");
      } else {
        toast.error(data.error || "Slot is no longer available.");
        fetchSlots(selectedDate);
      }
    } catch {
      toast.error("Failed to secure slot hold.");
    }
  }

  async function handleLiveAiTriage() {
    if (!symptoms || symptoms.trim().length < 5) {
      toast.error("Please describe your symptoms before analyzing.");
      return;
    }

    setAnalyzingAi(true);
    try {
      const res = await fetch("/api/ai/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, duration, painScale }),
      });

      const data = await res.json();
      if (res.ok) {
        setAiPreview(data.analysis);
        toast.success("Clinical symptom triage generated.");
      } else {
        toast.error("AI analysis failed.");
      }
    } catch {
      toast.error("Network error during AI triage.");
    } finally {
      setAnalyzingAi(false);
    }
  }

  async function handleConfirmBooking() {
    if (!selectedSlot) return;
    if (!symptoms || symptoms.trim().length < 5) {
      toast.error("Please describe your symptoms before confirming.");
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          symptoms,
          duration,
          painScale,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookedResult(data);
        setStep(3);
        toast.success("Appointment successfully booked and confirmed!");
      } else {
        toast.error(data.error || "Failed to finalize booking.");
      }
    } catch {
      toast.error("Error confirming appointment.");
    } finally {
      setBookingLoading(false);
    }
  }

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return {
      dateStr: format(d, "yyyy-MM-dd"),
      dayName: format(d, "EEE"),
      dayNumber: format(d, "d"),
      monthName: format(d, "MMM"),
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back Link */}
      <Link
        href="/patient/doctors"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Specialist Directory</span>
      </Link>

      {/* Doctor Summary Header */}
      {doctor && (
        <Card className="border border-slate-200 shadow-card bg-white overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar src={doctor.user.avatarUrl} name={doctor.user.name} size="lg" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  Dr. {doctor.user.name}
                </h2>
                <p className="text-xs font-semibold text-teal-700 mt-0.5">
                  {doctor.specialization.name} • {doctor.experienceYears}+ Years Experience
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md line-clamp-1">
                  {doctor.bio}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="text-xs text-slate-400 font-semibold uppercase">Consultation Fee</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatCurrency(doctor.consultationFee)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stepper Header */}
      <div className="flex items-center justify-between px-2 sm:px-6">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-teal-700 font-bold" : "text-slate-400 font-medium"} text-xs`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>
            1
          </span>
          <span>Select Time Slot</span>
        </div>
        <div className="h-0.5 w-12 sm:w-24 bg-slate-200" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-teal-700 font-bold" : "text-slate-400 font-medium"} text-xs`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>
            2
          </span>
          <span>Symptom Intake & AI Triage</span>
        </div>
        <div className="h-0.5 w-12 sm:w-24 bg-slate-200" />
        <div className={`flex items-center gap-2 ${step >= 3 ? "text-teal-700 font-bold" : "text-slate-400 font-medium"} text-xs`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>
            3
          </span>
          <span>Confirmation</span>
        </div>
      </div>

      {/* STEP 1: SELECT TIME SLOT */}
      {step === 1 && (
        <Card className="border border-slate-200 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Step 1: Choose Date & Consultation Slot</CardTitle>
            <p className="text-xs text-slate-500">
              Select an available time slot. Your selection will be temporarily locked for 10 minutes while you complete your intake.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Date Selector Pills */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2.5 block">Select Date</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.dateStr;
                  return (
                    <button
                      key={opt.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(opt.dateStr)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-teal-600 border-teal-600 text-white shadow-sm font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50/50"
                      }`}
                    >
                      <span className="text-[10px] uppercase block leading-tight">{opt.dayName}</span>
                      <span className="text-base font-bold block my-0.5">{opt.dayNumber}</span>
                      <span className="text-[10px] block opacity-80">{opt.monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-700">Available 30-Minute Slots</label>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                        slot.isAvailable
                          ? "bg-white border-slate-200 text-slate-800 hover:border-teal-600 hover:bg-teal-50 hover:text-teal-900 shadow-xs active:scale-95"
                          : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 inline mr-1 text-teal-600 opacity-75" />
                      {slot.timeDisplay}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                  No available consultation slots for this date. The doctor may be on leave or fully booked.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: SYMPTOM INTAKE & AI PRE-TRIAGE */}
      {step === 2 && selectedSlot && (
        <Card className="border border-slate-200 shadow-card">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">
                Step 2: Symptom Description & AI Triage
              </CardTitle>
              <p className="text-xs text-slate-500">
                Provide your symptoms to generate a pre-visit clinical triage for Dr. {doctor?.user?.name}.
              </p>
            </div>

            {/* Hold Expiry Countdown */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
              <span>
                Slot Held: {Math.floor(holdTimer / 60)}:
                {String(holdTimer % 60).padStart(2, "0")}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100 flex items-center justify-between text-xs text-teal-900">
              <div>
                <strong>Selected Time:</strong> {formatDateTime(selectedSlot.startTime)}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-teal-700 underline font-semibold hover:text-teal-900"
              >
                Change Slot
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Describe Your Symptoms in Detail *</span>
                  <span className="text-[11px] text-slate-400 font-normal">Min 10 characters</span>
                </label>
                <Textarea
                  placeholder="e.g. Mild shortness of breath and evening palpitations for 3 days, worse after mild stair climbing..."
                  className="min-h-[110px]"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Symptom Duration</label>
                  <Input
                    placeholder="e.g. 3 days, 2 weeks"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex justify-between">
                    <span>Pain / Discomfort Severity</span>
                    <span className="font-bold text-teal-700">{painScale}/10</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={painScale}
                    onChange={(e) => setPainScale(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>1 (Mild)</span>
                    <span>5 (Moderate)</span>
                    <span>10 (Severe)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleLiveAiTriage}
                  variant="outline"
                  size="sm"
                  isLoading={analyzingAi}
                  className="text-xs font-semibold gap-1.5 border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100"
                >
                  <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                  <span>Preview AI Pre-Triage Assessment</span>
                </Button>
              </div>

              {/* AI Pre-Triage Assessment Card */}
              {aiPreview && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50/80 to-white border border-teal-200 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                        AI Clinical Pre-Triage Generated
                      </h4>
                    </div>
                    <UrgencyBadge urgency={aiPreview.urgencyLevel} />
                  </div>

                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                        Chief Medical Complaint
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {aiPreview.chiefComplaint}
                      </p>
                    </div>

                    {aiPreview.suggestedQuestions?.length > 0 && (
                      <div className="pt-2">
                        <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-1">
                          Suggested Questions for Physician Review
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {aiPreview.suggestedQuestions.map((q: string, i: number) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back to Slots
              </Button>

              <Button
                type="button"
                variant="default"
                onClick={handleConfirmBooking}
                isLoading={bookingLoading}
                className="font-semibold text-xs gap-1.5 shadow-sm"
              >
                <span>Confirm & Book Consultation</span>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: BOOKING CONFIRMATION & CALENDAR SYNC */}
      {step === 3 && bookedResult && (
        <Card className="border border-teal-200 bg-white shadow-floating overflow-hidden">
          <div className="bg-teal-600 p-8 text-white text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Appointment Confirmed!</h2>
            <p className="text-xs text-teal-100 mt-1">
              Your consultation has been atomically reserved and recorded in the clinical registry.
            </p>
            <div className="mt-4 inline-block px-4 py-1.5 rounded-full bg-teal-800/80 font-mono text-sm font-bold tracking-wider">
              {bookedResult.appointment.appointmentNumber}
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Consulting Specialist</span>
                <p className="text-sm font-bold text-slate-900">Dr. {doctor?.user?.name}</p>
                <p className="text-xs text-teal-700 font-semibold">{doctor?.specialization?.name}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Scheduled Date & Time</span>
                <p className="text-sm font-bold text-slate-900">
                  {formatDateTime(bookedResult.appointment.startTime)}
                </p>
                <p className="text-xs text-slate-500">{doctor?.slotDurationMinutes} Minutes Duration</p>
              </div>
            </div>

            {/* AI Summary Highlight */}
            {bookedResult.aiTriage && (
              <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Pre-Visit AI Triage Record
                  </span>
                  <UrgencyBadge urgency={bookedResult.aiTriage.urgencyLevel} />
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  {bookedResult.aiTriage.chiefComplaint}
                </p>
              </div>
            )}

            {/* Calendar & Export Options */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Calendar & Follow-up Actions
              </h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`/api/calendar/ics/${bookedResult.appointment.id}`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="h-4 w-4 text-teal-400" />
                  <span>Download .ics Calendar File</span>
                </a>

                <Link href="/patient/appointments">
                  <Button variant="outline" className="text-xs font-semibold h-10 px-4">
                    View in My Appointments
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
