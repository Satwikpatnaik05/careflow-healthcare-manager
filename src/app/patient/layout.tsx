import React from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";

export default function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout requiredRole="PATIENT">{children}</PortalLayout>;
}
