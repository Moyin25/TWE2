import React from "react"
import VolunteerDashboardLayout from "@/components/volunteer/VolunteerDashboardLayout"

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return <VolunteerDashboardLayout>{children}</VolunteerDashboardLayout>
}
