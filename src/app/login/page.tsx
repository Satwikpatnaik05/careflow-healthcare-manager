"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  Mail,
  Lock,
  Sparkles,
  Stethoscope,
  User,
  ShieldCheck,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"PATIENT" | "DOCTOR" | "ADMIN">("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleTabChange(tab: "PATIENT" | "DOCTOR" | "ADMIN") {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
  }

  function handleQuickFill(demoEmail: string, role: "PATIENT" | "DOCTOR" | "ADMIN") {
    setActiveTab(role);
    setEmail(demoEmail);
    setPassword("Password123!");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Welcome back, ${data.user.name}!`);
        if (data.user.role === "ADMIN") router.push("/admin");
        else if (data.user.role === "DOCTOR") router.push("/doctor");
        else router.push("/patient");
        router.refresh();
      } else {
        toast.error(data.error || "Login failed. Please check your credentials.");
      }
    } catch {
      toast.error("Network error during login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
              <HeartPulse className="h-6 w-6" />
            </div>
            <span className="font-bold text-slate-900 text-2xl tracking-tight">CareFlow</span>
          </Link>
          <p className="text-sm text-slate-500">Clinical Healthcare Management Suite</p>
        </div>

        {/* Role Portal Selection Tabs */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 mb-4">
          <button
            type="button"
            onClick={() => handleTabChange("PATIENT")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "PATIENT"
                ? "bg-white text-teal-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="h-3.5 w-3.5 text-teal-600" />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("DOCTOR")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "DOCTOR"
                ? "bg-white text-blue-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
            <span>Doctor / Staff</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("ADMIN")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "ADMIN"
                ? "bg-white text-purple-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
            <span>Admin</span>
          </button>
        </div>

        <Card className="border-slate-200/90 shadow-card">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-900">
                {activeTab === "PATIENT" && "Patient Sign In"}
                {activeTab === "DOCTOR" && "Doctor & Staff Sign In"}
                {activeTab === "ADMIN" && "Executive Admin Console"}
              </CardTitle>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  activeTab === "PATIENT"
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : activeTab === "DOCTOR"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-purple-50 text-purple-800 border border-purple-200"
                }`}
              >
                {activeTab}
              </span>
            </div>
            <CardDescription className="text-xs text-slate-500">
              {activeTab === "PATIENT" && "Enter your patient email and password to access your appointments."}
              {activeTab === "DOCTOR" && "Sign in with your registered physician or clinical staff credentials."}
              {activeTab === "ADMIN" && "Executive credentials required for clinic operations and audit access."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder={
                      activeTab === "PATIENT"
                        ? "your-email@example.com"
                        : activeTab === "DOCTOR"
                        ? "doctor@careflow.health"
                        : "admin@careflow.health"
                    }
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                className={`w-full font-semibold gap-1.5 ${
                  activeTab === "DOCTOR"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : activeTab === "ADMIN"
                    ? "bg-purple-700 hover:bg-purple-800"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
                isLoading={loading}
              >
                <span>
                  {activeTab === "PATIENT" && "Sign In as Patient"}
                  {activeTab === "DOCTOR" && "Sign In as Doctor"}
                  {activeTab === "ADMIN" && "Enter Admin Console"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Registration Options */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-center text-xs">
              {activeTab === "PATIENT" && (
                <div>
                  <span className="text-slate-500">New to CareFlow? </span>
                  <Link href="/register" className="font-semibold text-teal-600 hover:underline inline-flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Create a Patient Account</span>
                  </Link>
                </div>
              )}

              {activeTab === "DOCTOR" && (
                <div>
                  <span className="text-slate-500">New Specialist / Physician? </span>
                  <Link href="/register" className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>Register as a Doctor</span>
                  </Link>
                </div>
              )}

              {activeTab === "ADMIN" && (
                <div className="text-slate-400 text-[11px]">
                  Authorized executive staff access only.
                </div>
              )}
            </div>

            {/* Optional Demo Credentials Helper */}
            <div className="mt-4 pt-4 border-t border-slate-100/80">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Or Test with Demo Persona:
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill("alice@patient.careflow.health", "PATIENT")}
                  className="p-1.5 text-center rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200/60 transition-colors"
                >
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">Patient</span>
                  <span className="text-[11px] font-medium text-slate-700 block truncate">Alice J.</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("dr.marcus@careflow.health", "DOCTOR")}
                  className="p-1.5 text-center rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition-colors"
                >
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Doctor</span>
                  <span className="text-[11px] font-medium text-slate-700 block truncate">Dr. Marcus</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@careflow.health", "ADMIN")}
                  className="p-1.5 text-center rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200/60 transition-colors"
                >
                  <span className="text-[10px] font-bold text-purple-800 uppercase block">Admin</span>
                  <span className="text-[11px] font-medium text-slate-700 block truncate">Dr. Vance</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
