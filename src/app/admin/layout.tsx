import React from "react";
import { PortalLayout } from "@/components/layout/PortalLayout";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayout requiredRole="ADMIN">{children}</PortalLayout>;
}
