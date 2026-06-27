import { NextRequest, NextResponse } from "next/server"
import { CampaignStatus, UserRole } from "@prisma/client"
import { prisma } from "@/lib/database"
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
  const userId = request.user.userId

  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "9", 10), 1), 24)
  const offset = (page - 1) * limit
  const q = searchParams.get("q")?.trim() || ""
  const category = searchParams.get("category")
  const location = searchParams.get("location")
  const urgency = searchParams.get("urgency")
  const impactLevel = searchParams.get("impactLevel")
  const sortBy = searchParams.get("sortBy") || "createdAt"

  const where: any = { status: CampaignStatus.ACTIVE }

  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { category: { contains: q } },
      { location: { contains: q } },
    ]
  }

  if (category && category !== "all") {
    where.category = { contains: category }
  }

  if (location && location !== "all") {
    where.location = { contains: location }
  }

  if (urgency && urgency !== "all") {
    where.urgency = urgency
  }

  if (impactLevel && impactLevel !== "all") {
    where.impactLevel = impactLevel
  }

  const orderBy =
    sortBy === "title"
      ? { title: "asc" as const }
      : sortBy === "goal"
        ? { goal: "desc" as const }
        : sortBy === "startDate"
          ? { startDate: "asc" as const }
          : { createdAt: "desc" as const }

  const [campaigns, total, memberships] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy,
      include: {
        _count: { select: { donations: true } },
      },
    }),
    prisma.campaign.count({ where }),
    volunteerDb.volunteerCampaign.findMany({
      where: { userId },
      select: { id: true, campaignId: true, status: true, joinedAt: true },
    }),
  ])

  const membershipByCampaign = new Map<string, any>(memberships.map((item: any) => [item.campaignId, item]))
  const personalizedCampaigns = campaigns.map((campaign) => ({
    ...campaign,
    volunteerStatus: membershipByCampaign.get(campaign.id)?.status || null,
    volunteerMembershipId: membershipByCampaign.get(campaign.id)?.id || null,
  }))

  return NextResponse.json({
    campaigns: personalizedCampaigns,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: offset + campaigns.length < total,
      hasPrev: page > 1,
    },
    filters: { q, category, location, urgency, impactLevel, sortBy },
  })
}

export const GET = withAuth(handler, [UserRole.VOLUNTEER, UserRole.ADMIN])
