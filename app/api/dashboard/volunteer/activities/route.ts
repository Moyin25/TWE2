import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { withAuth } from "@/lib/middleware/auth"
import { volunteerDb } from "@/lib/volunteer-dashboard"

type VolunteerRequest = NextRequest & {
  user: {
    userId: string
    role: UserRole
  }
}

export const dynamic = "force-dynamic"

async function handler(request: VolunteerRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const userId = request.user.userId

  const where: any = { userId }
  if (status && status !== "all") {
    where.status = status
  }

  const activities = await volunteerDb.volunteerCampaign.findMany({
    where,
    orderBy: { joinedAt: "desc" },
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          description: true,
          image: true,
          location: true,
          category: true,
          goal: true,
          raised: true,
          urgency: true,
          impactLevel: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  })

  return NextResponse.json({ activities })
}

export const GET = withAuth(handler, [UserRole.VOLUNTEER, UserRole.ADMIN])
