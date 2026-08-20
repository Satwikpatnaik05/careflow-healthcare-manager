import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Stethoscope,
  Activity,
  Mail,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { formatDateTime, formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [
    totalDoctors,
    totalPatients,
    totalAppointments,
    completedAppointments,
    notificationsCount,
    recentAppointments,
    specializations,
  ] = await Promise.all([
    prisma.doctorProfile.count(),
    prisma.patientProfile.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.notificationLog.count(),
    prisma.appointment.findMany({
      include: {
        doctor: { include: { user: true, specialization: true } },
        patient: { include: { user: true } },
        symptomAssessment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.specialization.findMany({
      include: { _count: { select: { doctors: true } } },
    }),
  ]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-slate-900 p-6 sm:p-8 text-white shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800 border border-purple-700 text-purple-200 text-xs font-semibold mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
            <span>Executive Clinic Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Clinic Operations & System Oversight
          </h2>
          <p className="text-sm text-purple-200/80 mt-1">
            Global appointment audit, physician directory, leave conflict management, and notification logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/doctors">
            <Button variant="default" className="bg-teal-600 hover:bg-teal-700 font-semibold text-xs gap-1.5 shadow-sm">
              <Stethoscope className="h-4 w-4" />
              <span>Manage Doctors</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Doctors
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalDoctors}</p>
          <span className="text-[11px] text-teal-700 font-medium">Active Staff Physicians</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Registered Patients
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalPatients}</p>
          <span className="text-[11px] text-blue-700 font-medium">Active Health Records</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalAppointments}</p>
          <span className="text-[11px] text-purple-700 font-medium">{completedAppointments} Completed Visits</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Notifications Sent
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{notificationsCount}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Emails & Reminder Alerts</span>
        </div>
      </div>

      {/* Main Grid: Recent Activity Feed + Specialty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Bookings Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Clinical Consultations</h3>
              <p className="text-xs text-slate-500">Live booking stream across all specialties</p>
            </div>
            <Link href="/admin/leaves" className="text-xs font-semibold text-teal-700 hover:underline">
              Leave Conflicts
            </Link>
          </div>

          <div className="space-y-3">
            {recentAppointments.map((apt) => (
              <Card key={apt.id} className="border border-slate-200 shadow-card hover:border-teal-200 transition-all">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={apt.patient.user.avatarUrl} name={apt.patient.user.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{apt.patient.user.name}</span>
                        <StatusBadge status={apt.status} />
                        {apt.symptomAssessment && (
                          <UrgencyBadge urgency={apt.symptomAssessment.urgencyLevel} showIcon={false} />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dr. {apt.doctor.user.name} ({apt.doctor.specialization.name}) • {formatDateTime(apt.startTime)}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {apt.appointmentNumber}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Specialty Distribution */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Department Directory</h3>
            <p className="text-xs text-slate-500">Specialist coverage by department</p>
          </div>

          <div className="space-y-2.5">
            {specializations.map((spec) => (
              <div
                key={spec.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-card flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{spec.name}</h4>
                  <p className="text-[11px] text-slate-500">{spec.description}</p>
                </div>
                <span className="font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs shrink-0">
                  {spec._count.doctors} MDs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
