import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  Users,
  Stethoscope,
  CheckCircle2,
  FileEdit,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatTime, formatDate, formatDateTime } from "@/lib/utils";

export default async function DoctorDashboardPage() {
  const session = await getSession();
  if (!session?.doctorProfileId) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Fetch today's appointments for this doctor
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: session.doctorProfileId,
      startTime: { gte: startOfToday, lte: endOfToday },
    },
    include: {
      patient: {
        include: { user: true },
      },
      symptomAssessment: true,
      consultationRecord: true,
    },
    orderBy: { startTime: "asc" },
  });

  // Fetch upcoming scheduled appointments
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: session.doctorProfileId,
      startTime: { gt: endOfToday },
      status: "CONFIRMED",
    },
    include: {
      patient: {
        include: { user: true },
      },
      symptomAssessment: true,
    },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  // Stats
  const totalCompleted = await prisma.appointment.count({
    where: {
      doctorId: session.doctorProfileId,
      status: "COMPLETED",
    },
  });

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-semibold mb-3">
            <Activity className="h-3.5 w-3.5 text-teal-400" />
            <span>Clinical Workstation Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dr. {session.name}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Review pre-visit AI symptom summaries, conduct live clinical visits, and issue care plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/doctor/schedule">
            <Button variant="outline" className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-semibold">
              Manage Leaves & Hours
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Today&apos;s Patient Queue
            </span>
            <span className="text-xl font-bold text-slate-900">
              {todayAppointments.length} Consultations
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              High Urgency Cases
            </span>
            <span className="text-xl font-bold text-slate-900">
              {todayAppointments.filter((a) => a.symptomAssessment?.urgencyLevel === "HIGH" || a.symptomAssessment?.urgencyLevel === "CRITICAL").length} High Priority
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Lifetime Completed
            </span>
            <span className="text-xl font-bold text-slate-900">
              {totalCompleted} Patients
            </span>
          </div>
        </div>
      </div>

      {/* Today's Appointment Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Today&apos;s Clinical Queue</h3>
            <p className="text-xs text-slate-500">Patients scheduled for today with AI symptom assessments</p>
          </div>
          <span className="text-xs font-semibold text-slate-400 font-mono">
            {formatDate(new Date())}
          </span>
        </div>

        {todayAppointments.length > 0 ? (
          <div className="space-y-4">
            {todayAppointments.map((apt) => {
              const suggestedQuestions = apt.symptomAssessment?.suggestedQuestions
                ? JSON.parse(apt.symptomAssessment.suggestedQuestions)
                : [];

              return (
                <Card
                  key={apt.id}
                  className="border border-slate-200 shadow-card hover:border-teal-200 transition-all overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={apt.patient.user.avatarUrl}
                          name={apt.patient.user.name}
                          size="lg"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-bold text-slate-900">
                              {apt.patient.user.name}
                            </h4>
                            <StatusBadge status={apt.status} />
                            {apt.symptomAssessment && (
                              <UrgencyBadge urgency={apt.symptomAssessment.urgencyLevel} />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {apt.appointmentNumber} • {apt.patient.gender || "Patient"} • Blood Group: {apt.patient.bloodGroup || "Unknown"}
                          </p>
                          <p className="text-xs font-semibold text-teal-700 mt-1 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Slot: {formatTime(apt.startTime)} - {formatTime(apt.endTime)}</span>
                          </p>
                        </div>
                      </div>

                      <Link href={`/doctor/consult/${apt.id}`}>
                        <Button variant="default" className="text-xs font-semibold gap-1.5 shadow-sm">
                          <FileEdit className="h-4 w-4" />
                          <span>{apt.status === "COMPLETED" ? "Review / Edit Consultation" : "Enter Consultation Room"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>

                    {/* AI Pre-Visit Triage Box */}
                    {apt.symptomAssessment && (
                      <div className="mt-4 p-4 rounded-xl bg-teal-50/60 border border-teal-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                            <span>AI Pre-Visit Triage Assessment</span>
                          </div>
                          <span className="text-[10px] text-teal-700 font-mono">
                            Model: {apt.symptomAssessment.llmModelUsed || "Clinical Heuristic"}
                          </span>
                        </div>

                        <div className="text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Chief Complaint
                          </span>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {apt.symptomAssessment.chiefComplaint}
                          </p>
                          <p className="text-slate-600 mt-1 italic">
                            &quot;{apt.symptomAssessment.rawSymptoms}&quot;
                          </p>
                        </div>

                        {suggestedQuestions.length > 0 && (
                          <div className="pt-2 border-t border-teal-100/80">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                              AI Suggested Diagnostic Inquiries for Doctor:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                              {suggestedQuestions.map((q: string, i: number) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No Appointments Scheduled for Today"
            description="You have no patients in your clinical queue for today."
          />
        )}
      </div>

      {/* Upcoming Week Appointments */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Upcoming Consultations This Week</h3>
            <p className="text-xs text-slate-500">Upcoming booked visits</p>
          </div>
          <Link href="/doctor/appointments" className="text-xs font-semibold text-teal-700 hover:underline">
            View All
          </Link>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((apt) => (
              <Card key={apt.id} className="border border-slate-200 shadow-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={apt.patient.user.avatarUrl} name={apt.patient.user.name} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{apt.patient.user.name}</h4>
                      <p className="text-xs text-slate-500">{formatDateTime(apt.startTime)}</p>
                      {apt.symptomAssessment && (
                        <div className="mt-1">
                          <UrgencyBadge urgency={apt.symptomAssessment.urgencyLevel} showIcon={false} />
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/doctor/consult/${apt.id}`}>
                    <Button variant="outline" size="sm" className="text-xs font-semibold">
                      Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No upcoming appointments scheduled for later this week.</p>
        )}
      </div>
    </div>
  );
}
