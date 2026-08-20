"use client";

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Plus,
  Search,
  UserCheck,
  Star,
  Clock,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    setLoading(true);
    try {
      const res = await fetch("/api/doctors");
      const data = await res.json();
      if (data.doctors) setDoctors(data.doctors);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = doctors.filter((doc) => {
    if (!search) return true;
    const nameMatch = doc.user?.name?.toLowerCase().includes(search.toLowerCase());
    const specMatch = doc.specialization?.name?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || specMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Physician Staff Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage clinical profiles, consultation fees, slot durations, and weekly operating schedules.
          </p>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-card">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search physicians by name or clinical specialty..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid of Doctors */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <Card key={doc.id} className="border border-slate-200 shadow-card hover:border-teal-200 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar src={doc.user?.avatarUrl} name={doc.user?.name} size="lg" />
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-slate-900">{doc.user?.name}</h3>
                    <p className="text-xs font-semibold text-teal-700">{doc.specialization?.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">License: {doc.licenseNumber}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.bio}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fee / Session</span>
                    <span className="font-bold text-slate-900">{formatCurrency(doc.consultationFee)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot Duration</span>
                    <span className="font-semibold text-slate-700">{doc.slotDurationMinutes} Mins</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Weekly Shifts: Mon - Fri</span>
                  <span className="font-semibold text-emerald-700">09:00 - 17:00</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
