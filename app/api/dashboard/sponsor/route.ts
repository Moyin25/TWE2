import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { withAuth } from "@/lib/middleware/auth"
import { getSponsorDashboard } from "@/lib/sponsor-dashboard"

type SponsorRequest = NextRequest & {
  user: {
    userId: string
    email: string
    role: UserRole
  }
}

export const dynamic = "force-dynamic"

async function handler(request: SponsorRequest) {
  const dashboard = await getSponsorDashboard(request.user.userId)

  if (!dashboard) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(dashboard)
}

export const GET = withAuth(handler, [UserRole.SPONSOR, UserRole.ADMIN])

