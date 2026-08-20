import React from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout requiredRole="DOCTOR">{children}</PortalLayout>;
}
