"use client";

import React, { useState } from "react";
import { Users, Check, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DemoAccount {
  name: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  email: string;
  detail: string;
  portalUrl: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: "Alice Johnson",
    role: "PATIENT",
    email: "alice@patient.careflow.health",
    detail: "Active Patient (Asthma / Penicillin allergy)",
    portalUrl: "/patient",
  },
  {
    name: "Robert Davis",
    role: "PATIENT",
    email: "robert@patient.careflow.health",
    detail: "Hypertension Patient (Has active Lisinopril prescription)",
    portalUrl: "/patient",
  },
  {
    name: "Dr. Marcus Chen, MD",
    role: "DOCTOR",
    email: "dr.marcus@careflow.health",
    detail: "Cardiologist (Schedule & Consultation Room)",
    portalUrl: "/doctor",
  },
  {
    name: "Dr. Sarah Jenkins, MD",
    role: "DOCTOR",
    email: "dr.sarah@careflow.health",
    detail: "Dermatologist (Bookings & AI Triage)",
    portalUrl: "/doctor",
  },
  {
    name: "Dr. Eleanor Vance",
    role: "ADMIN",
    email: "admin@careflow.health",
    detail: "Chief Medical Officer (Full Analytics & Doctor Leaves)",
    portalUrl: "/admin",
  },
];

export function DemoAccountSwitcher({ currentEmail }: { currentEmail?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const router = useRouter();

  async function handleSwitch(account: DemoAccount) {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/auth/switch-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });

      if (res.ok) {
        toast.success(`Switched role to ${account.name} (${account.role})`);
        setIsOpen(false);
        router.push(account.portalUrl);
        router.refresh();
      } else {
        toast.error("Failed to switch account.");
      }
    } catch {
      toast.error("Error switching account.");
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-2 w-80 rounded-2xl bg-white p-3 shadow-floating border border-slate-200 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Role Quick Switcher</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Demo Mode</span>
          </div>

          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = currentEmail === acc.email;
              return (
                <button
                  key={acc.email}
                  onClick={() => handleSwitch(acc)}
                  disabled={isSwitching}
                  className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                    isCurrent
                      ? "bg-teal-50 border border-teal-200 text-teal-900"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{acc.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                          acc.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : acc.role === "DOCTOR"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 max-w-[200px]">
                      {acc.detail}
                    </div>
                  </div>
                  {isCurrent && <Check className="h-4 w-4 text-teal-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="default"
        size="sm"
        className="rounded-full shadow-lg bg-slate-900 hover:bg-slate-800 text-white gap-2 px-3.5 h-9"
      >
        <Users className="h-4 w-4 text-teal-400" />
        <span className="text-xs font-semibold">Switch Demo Persona</span>
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
