import React from "react";
import { getSession, getUserWithProfiles } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DemoAccountSwitcher } from "@/components/shared/DemoAccountSwitcher";
import { redirect } from "next/navigation";

export async function PortalLayout({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "PATIENT" | "DOCTOR" | "ADMIN";
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (requiredRole && session.role !== requiredRole && session.role !== "ADMIN") {
    // Redirect to user's assigned portal
    if (session.role === "DOCTOR") redirect("/doctor");
    if (session.role === "PATIENT") redirect("/patient");
  }

  const fullUser = await getUserWithProfiles(session.id);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={fullUser} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={fullUser} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <DemoAccountSwitcher currentEmail={session.email} />
    </div>
  );
}
