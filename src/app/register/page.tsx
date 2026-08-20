"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HeartPulse,
  Mail,
  Lock,
  User,
  Phone,
  Stethoscope,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Specialization {
  id: string;
  name: string;
  description?: string;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "doctor" ? "DOCTOR" : "PATIENT";
  const [role, setRole] = useState<"PATIENT" | "DOCTOR">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Patient Fields
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [medicalHistory, setMedicalHistory] = useState("");

  // Doctor Fields
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [specializationId, setSpecializationId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [consultationFee, setConsultationFee] = useState(85);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("role") === "doctor") {
      setRole("DOCTOR");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/specializations")
      .then((r) => r.json())
      .then((d) => {
        if (d.specializations?.length > 0) {
          setSpecializations(d.specializations);
          setSpecializationId(d.specializations[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload =
        role === "PATIENT"
          ? {
              name,
              email,
              password,
              phone,
              role: "PATIENT",
              gender,
              bloodGroup,
              medicalHistory,
            }
          : {
              name,
              email,
              password,
              phone,
              role: "DOCTOR",
              specializationId,
              licenseNumber: licenseNumber || `MD-${Math.floor(10000 + Math.random() * 90000)}`,
              experienceYears: Number(experienceYears),
              consultationFee: Number(consultationFee),
              slotDurationMinutes: Number(slotDurationMinutes),
              bio,
            };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Account registered successfully! Welcome to CareFlow.`);
        if (role === "DOCTOR") {
          router.push("/doctor");
        } else {
          router.push("/patient");
        }
        router.refresh();
      } else {
        toast.error(data.error || "Registration failed.");
      }
    } catch {
      toast.error("Network error during registration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl">
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/30">
            <HeartPulse className="h-6 w-6" />
          </div>
          <span className="font-bold text-slate-900 text-2xl tracking-tight">CareFlow</span>
        </Link>
        <p className="text-sm text-slate-500">Create your health or clinical provider account</p>
      </div>

      {/* Role Switch Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 p-1 mb-4">
        <button
          type="button"
          onClick={() => setRole("PATIENT")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            role === "PATIENT"
              ? "bg-white text-teal-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="h-4 w-4 text-teal-600" />
          <span>Register as Patient</span>
        </button>

        <button
          type="button"
          onClick={() => setRole("DOCTOR")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            role === "DOCTOR"
              ? "bg-white text-blue-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Stethoscope className="h-4 w-4 text-blue-600" />
          <span>Register as Doctor / Specialist</span>
        </button>
      </div>

      <Card className="border-slate-200/90 shadow-card">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900">
              {role === "PATIENT" ? "Patient Registration" : "Physician Clinical Onboarding"}
            </CardTitle>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                role === "PATIENT"
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
              }`}
            >
              {role === "PATIENT" ? "Patient" : "Doctor"}
            </span>
          </div>
          <CardDescription className="text-xs text-slate-500">
            {role === "PATIENT"
              ? "Book clinical consultations, view AI symptom triage, and track medications."
              : "Set up your medical specialty profile, consultation fees, and weekly schedule."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Common Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {role === "PATIENT" ? "Full Name" : "Physician Name (e.g. Dr. Jane Smith)"}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={role === "PATIENT" ? "Jane Doe" : "Dr. Jane Smith, MD"}
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="+1 (555) 000-0000"
                    className="pl-9"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder={role === "PATIENT" ? "jane@example.com" : "dr.jane@careflow.health"}
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
                    placeholder="Create password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* PATIENT SPECIFIC FIELDS */}
            {role === "PATIENT" && (
              <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:border-teal-600"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:border-teal-600"
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Medical History & Known Allergies (Optional)
                  </label>
                  <Textarea
                    placeholder="e.g. Mild asthma, allergic to penicillin, previous knee surgery..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="min-h-[70px]"
                  />
                </div>
              </div>
            )}

            {/* DOCTOR SPECIFIC FIELDS */}
            {role === "DOCTOR" && (
              <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Medical Specialty *</label>
                    <select
                      value={specializationId}
                      onChange={(e) => setSpecializationId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:border-teal-600"
                      required
                    >
                      {specializations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Medical License Number *</label>
                    <div className="relative">
                      <Award className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="e.g. MD-CA-48192"
                        className="pl-9"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Experience (Years)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Consultation Fee ($)</label>
                    <Input
                      type="number"
                      min="10"
                      max="1000"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Slot Duration (Mins)</label>
                    <select
                      value={slotDurationMinutes}
                      onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:border-teal-600"
                    >
                      <option value={15}>15 Mins</option>
                      <option value={30}>30 Mins</option>
                      <option value={45}>45 Mins</option>
                      <option value={60}>60 Mins</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Professional Bio & Clinical Focus
                  </label>
                  <Textarea
                    placeholder="e.g. Board-certified physician with extensive experience in clinical diagnosis, echocardiography, and preventive healthcare..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[70px]"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className={`w-full font-semibold mt-2 ${
                role === "DOCTOR" ? "bg-blue-600 hover:bg-blue-700" : "bg-teal-600 hover:bg-teal-700"
              }`}
              isLoading={loading}
            >
              {role === "PATIENT" ? "Complete Patient Registration" : "Complete Doctor Onboarding"}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-600 hover:underline">
              Sign in to your portal
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading registration form...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
