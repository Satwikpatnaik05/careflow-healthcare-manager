"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  Sparkles,
  CalendarCheck,
  ShieldCheck,
  Stethoscope,
  Pill,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Brain,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const DEMO_PERSONAS = [
  {
    role: "Patient Portal",
    badge: "PATIENT",
    name: "Alice Johnson",
    email: "alice@patient.careflow.health",
    desc: "Search specialists, book slots with AI symptom triage, view prescriptions & medication reminders.",
    url: "/patient",
    color: "teal",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  },
  {
    role: "Doctor Portal",
    badge: "DOCTOR",
    name: "Dr. Marcus Chen, MD",
    email: "dr.marcus@careflow.health",
    desc: "Review AI pre-visit urgency assessments, record clinical notes, generate patient-friendly summaries & prescriptions.",
    url: "/doctor",
    color: "blue",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
  },
  {
    role: "Admin Console",
    badge: "ADMIN",
    name: "Dr. Eleanor Vance",
    email: "admin@careflow.health",
    desc: "Manage doctor profiles, approve leaves with automatic conflict resolution & audit notification dispatch logs.",
    url: "/admin",
    color: "purple",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
  },
];

export default function LandingPage() {
  const router = useRouter();

  async function handleDemoLogin(email: string, targetUrl: string) {
    try {
      const res = await fetch("/api/auth/switch-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success(`Logged in as demo persona!`);
        router.push(targetUrl);
      }
    } catch {
      toast.error("Failed to authenticate demo user.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight leading-none block">
                CareFlow
              </span>
              <span className="text-[10px] text-teal-700 font-semibold tracking-wider uppercase">
                Clinical Healthcare Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm" className="font-medium text-xs border-teal-200 text-teal-800 hover:bg-teal-50">
                Register as Patient
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="default" size="sm" className="font-semibold text-xs shadow-sm bg-blue-600 hover:bg-blue-700">
                Join as Doctor
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-white via-teal-50/30 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>AI-Augmented Healthcare Scheduling & Clinical Follow-up</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Modern Healthcare Delivery,{" "}
            <span className="text-teal-600">Smarter Scheduling</span> & Connected Follow-ups.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate double-booking conflicts with atomic slot holds, empower physicians with AI-driven pre-visit triage, and ensure clinical adherence with automated post-visit care plans.
          </p>

          {/* Quick Access Demo Personas */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="text-left mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Instant 1-Click Role Exploration (Evaluation Ready)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEMO_PERSONAS.map((p) => (
                <Card
                  key={p.email}
                  className="text-left border border-slate-200/90 shadow-card hover:shadow-floating hover:border-teal-300 transition-all duration-200 relative group overflow-hidden bg-white"
                >
                  <div
                    className={`h-1.5 w-full ${
                      p.color === "teal"
                        ? "bg-teal-600"
                        : p.color === "blue"
                        ? "bg-blue-600"
                        : "bg-purple-600"
                    }`}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          p.color === "teal"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : p.color === "blue"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-purple-50 text-purple-800 border border-purple-200"
                        }`}
                      >
                        {p.badge}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="h-9 w-9 rounded-full object-cover border border-slate-200"
                      />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{p.role}</h3>
                    <p className="text-xs font-semibold text-slate-700 mb-2">{p.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-3 mb-6 min-h-[48px]">
                      {p.desc}
                    </p>

                    <Button
                      onClick={() => handleDemoLogin(p.email, p.url)}
                      variant="default"
                      className="w-full text-xs font-semibold gap-1.5"
                    >
                      <span>Enter as {p.name.split(" ")[0]}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Engineered for Clinical Precision & Reliability
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Designed from the ground up to solve the real operational challenges of modern clinics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">
                Zero Double-Booking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                DB-level compound constraints combined with 10-minute atomic slot holds eliminate race conditions completely.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Brain className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">
                AI Pre-Visit Triage
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Analyzes patient symptoms before the visit to provide urgency ratings and 3 targeted diagnostic questions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Pill className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">
                Post-Visit Care Plan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Converts complex physician notes into plain-English patient instructions with automated medication reminders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <MailCheck className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-1">
                Leave Conflict Resolver
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Marking doctor leave automatically flags conflicting bookings and emails affected patients with 1-click reschedule links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-100 border-t border-slate-200/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 CareFlow Healthcare Suite. Built with React, Next.js, TypeScript, Tailwind CSS, Prisma & NextAuth.</p>
        </div>
      </footer>
    </div>
  );
}
