"use client"

import React from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { useSession } from "@/hooks/useSession"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  // Re-enable session management with debugging logs
  useSession(30 * 60 * 1000)

  return <DashboardLayout>{children}</DashboardLayout>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
