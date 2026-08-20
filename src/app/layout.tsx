import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { initCronScheduler } from "@/lib/jobs/scheduler";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CareFlow - Healthcare Appointment & Follow-up Manager",
  description:
    "Production-grade healthcare scheduling platform with AI-powered symptom triage, clinical summary translation, atomic slot booking, and medication reminders.",
};

// Initialize background cron scheduler in server runtime
if (typeof window === "undefined") {
  try {
    initCronScheduler();
  } catch (e) {
    console.error("[Root Cron Init Error]", e);
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
