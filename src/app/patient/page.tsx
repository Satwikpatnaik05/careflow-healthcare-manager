import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  CalendarCheck,
  Stethoscope,
  Pill,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Download,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime, formatDate, formatTime } from "@/lib/utils";

export default async function PatientDashboardPage() {
  const session = await getSession();
  if (!session?.patientProfileId) return null;

  const now = new Date();

  // Fetch upcoming confirmed appointment
  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: session.patientProfileId,
      status: "CONFIRMED",
      startTime: { gte: now },
    },
    include: {
      doctor: {
        include: {
          user: true,
          specialization: true,
        },
      },
      symptomAssessment: true,
    },
    orderBy: { startTime: "asc" },
  });

  // Fetch recent completed consultations
  const recentCompleted = await prisma.appointment.findMany({
    where: {
      patientId: session.patientProfileId,
      status: "COMPLETED",
    },
    include: {
      doctor: {
        include: { user: true, specialization: true },
      },
      consultationRecord: true,
      prescriptions: true,
    },
    orderBy: { startTime: "desc" },
    take: 3,
  });

  // Fetch active medications
  const activePrescriptions = await prisma.prescription.findMany({
    where: {
      appointment: { patientId: session.patientProfileId },
      OR: [{ endDate: { gte: now } }, { endDate: null }],
    },
    include: {
      appointment: {
        include: {
          doctor: { include: { user: true } },
        },
      },
    },
    take: 4,
  });

  // Count total stats
  const totalAppointmentsCount = await prisma.appointment.count({
    where: { patientId: session.patientProfileId },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-800 to-teal-700 p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-600/60 border border-teal-400/30 text-teal-100 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-teal-300" />
              <span>Personalized Health Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {session.name}
            </h2>
            <p className="text-sm text-teal-100/90 mt-1 leading-relaxed">
              Track your upcoming clinical appointments, review AI symptom assessments, and manage your daily prescription schedule.
            </p>
          </div>

          <Link href="/patient/doctors">
            <Button
              variant="default"
              size="lg"
              className="bg-white text-teal-900 hover:bg-teal-50 shadow-md font-bold text-sm shrink-0 gap-2"
            >
              <Stethoscope className="h-4 w-4 text-teal-600" />
              <span>Book a Specialist</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Upcoming Visit
            </span>
            <span className="text-xl font-bold text-slate-900">
              {nextAppointment ? formatDate(nextAppointment.startTime) : "None Scheduled"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Prescriptions
            </span>
            <span className="text-xl font-bold text-slate-900">
              {activePrescriptions.length} Meds
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Consultations
            </span>
            <span className="text-xl font-bold text-slate-900">
              {totalAppointmentsCount} Records
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Next Appointment + Active Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Appointment Card (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upcoming Consultation</h3>
            <p className="text-xs text-slate-500">Your next scheduled clinical check-in</p>
          </div>

          {nextAppointment ? (
            <Card className="border border-slate-200 shadow-card overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={nextAppointment.doctor.user.avatarUrl}
                      name={nextAppointment.doctor.user.name}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">
                          Dr. {nextAppointment.doctor.user.name}
                        </h4>
                        <StatusBadge status={nextAppointment.status} />
                      </div>
                      <p className="text-xs font-medium text-teal-700 mt-0.5">
                        {nextAppointment.doctor.specialization.name} • {nextAppointment.appointmentNumber}
                      </p>
                    </div>
                  </div>

                  {nextAppointment.symptomAssessment && (
                    <UrgencyBadge urgency={nextAppointment.symptomAssessment.urgencyLevel} />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                      <Clock className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Date & Time
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatDateTime(nextAppointment.startTime)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                        Chief Symptom Complaint
                      </span>
                      <span className="text-xs font-medium text-slate-700 line-clamp-1">
                        {nextAppointment.symptomAssessment?.chiefComplaint || "Routine consultation"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
                  <a
                    href={`/api/calendar/ics/${nextAppointment.id}`}
                    download
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .ics Calendar Invite</span>
                  </a>

                  <Link href="/patient/appointments">
                    <Button variant="default" size="sm" className="font-semibold text-xs gap-1">
                      <span>View Full Triage Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No Upcoming Consultations"
              description="You do not have any appointments scheduled at this time."
              actionLabel="Book a Specialist"
              actionHref="/patient/doctors"
            />
          )}

          {/* Recent Completed Consultations with AI Summaries */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Health Summaries</h3>
                <p className="text-xs text-slate-500">Post-visit care plans translated into plain English</p>
              </div>
              <Link href="/patient/appointments" className="text-xs font-semibold text-teal-700 hover:underline">
                View All
              </Link>
            </div>

            {recentCompleted.length > 0 ? (
              <div className="space-y-4">
                {recentCompleted.map((apt) => (
                  <Card key={apt.id} className="border border-slate-200/90 shadow-card">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={apt.doctor.user.avatarUrl}
                            name={apt.doctor.user.name}
                            size="sm"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Dr. {apt.doctor.user.name} ({apt.doctor.specialization.name})
                            </h4>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Consultation on {formatDate(apt.startTime)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status="COMPLETED" />
                      </div>

                      {apt.consultationRecord && (
                        <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                            <span>Diagnosis: {apt.consultationRecord.diagnosis}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {apt.consultationRecord.patientFriendlySummary}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No past consultation records available yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Active Medications & Reminders */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-0.5">My Medications</h3>
              <p className="text-xs text-slate-500">Active prescription adherence</p>
            </div>
            <Link href="/patient/medications" className="text-xs font-semibold text-teal-700 hover:underline">
              Manage
            </Link>
          </div>

          {activePrescriptions.length > 0 ? (
            <div className="space-y-3">
              {activePrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-card hover:border-teal-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rx.medicationName}</h4>
                      <span className="text-xs font-semibold text-teal-700">{rx.dosage}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {rx.frequency.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    Timing: <strong className="text-slate-700">{rx.timing || "As instructed"}</strong>
                  </p>

                  {rx.instructions && (
                    <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {rx.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 text-center">
              <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No Active Prescriptions</p>
              <p className="text-[11px] text-slate-400 mt-1">Prescriptions issued by your doctor will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
