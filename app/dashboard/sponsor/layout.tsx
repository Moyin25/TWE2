import React from "react"
import SponsorDashboardLayout from "@/components/sponsor/SponsorDashboardLayout"

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return <SponsorDashboardLayout>{children}</SponsorDashboardLayout>
}

