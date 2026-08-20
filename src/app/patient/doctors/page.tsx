"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Stethoscope, Star, Calendar, ShieldCheck, Sparkles, Filter, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";

interface Doctor {
  id: string;
  experienceYears: number;
  consultationFee: number;
  slotDurationMinutes: number;
  bio: string | null;
  rating: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  };
  specialization: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface Specialization {
  id: string;
  name: string;
  description: string | null;
}

export default function DoctorSearchPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecializations();
    fetchDoctors();
  }, []);

  async function fetchSpecializations() {
    try {
      const res = await fetch("/api/specializations");
      const data = await res.json();
      if (data.specializations) setSpecializations(data.specializations);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchDoctors(spec?: string, query?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (spec && spec !== "all") params.set("specialization", spec);
      if (query) params.set("q", query);

      const res = await fetch(`/api/doctors?${params.toString()}`);
      const data = await res.json();
      if (data.doctors) setDoctors(data.doctors);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleSpecFilter(specName: string) {
    setSelectedSpec(specName);
    fetchDoctors(specName, searchQuery);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchDoctors(selectedSpec, searchQuery);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Find a Specialist</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Book certified physicians and clinical experts with AI-assisted symptom triage.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="border border-slate-200 shadow-card">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search doctor by name, specialty, or condition..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" variant="default" className="font-semibold px-5">
              Search
            </Button>
          </form>

          {/* Specialty Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleSpecFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSpec === "all"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Specialties
            </button>
            {specializations.map((spec) => (
              <button
                key={spec.id}
                onClick={() => handleSpecFilter(spec.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSpec === spec.name
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Card
              key={doc.id}
              className="border border-slate-200/90 shadow-card hover:shadow-floating hover:border-teal-300 transition-all duration-200 flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar src={doc.user.avatarUrl} name={doc.user.name} size="lg" />
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {doc.user.name}
                    </h3>
                    <p className="text-xs font-semibold text-teal-700 mt-0.5">
                      {doc.specialization.name}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-bold text-slate-700">{doc.rating.toFixed(1)}</span>
                      <span className="text-[11px] text-slate-400">• {doc.experienceYears}+ yrs exp</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 min-h-[48px] leading-relaxed">
                  {doc.bio || "Certified specialist committed to high quality clinical care."}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Consultation Fee
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(doc.consultationFee)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Slot Duration
                    </span>
                    <span className="font-semibold text-slate-700">
                      {doc.slotDurationMinutes} Mins
                    </span>
                  </div>
                </div>

                <Link href={`/patient/book/${doc.id}`} className="block pt-2">
                  <Button variant="default" className="w-full text-xs font-semibold gap-1.5 shadow-sm">
                    <span>Book Consultation</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Stethoscope}
          title="No Specialists Found"
          description="Try broadening your search term or selecting a different specialty category."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedSpec("all");
            setSearchQuery("");
            fetchDoctors("all", "");
          }}
        />
      )}
    </div>
  );
}
