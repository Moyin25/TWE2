import { NextRequest, NextResponse } from "next/server"
import { CampaignStatus, UserRole } from "@prisma/client"
import { prisma } from "@/lib/database"
import { withAuth } from "@/lib/middleware/auth"
import { campaignProgress } from "@/lib/sponsor-dashboard"

type SponsorRequest = NextRequest & {
  user: {
    userId: string
    role: UserRole
  }
}

export const dynamic = "force-dynamic"

async function handler(request: SponsorRequest) {
  const { searchParams } = new URL(request.url)
  const userId = request.user.userId
  const q = searchParams.get("q")?.trim() || ""
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
        : { createdAt: "desc" as const }

  const [campaigns, sponsorGroups] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy,
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
        _count: { select: { donations: true, volunteers: true } },
      },
      take: 24,
    }),
    prisma.donation.groupBy({
      by: ["campaignId"],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const sponsorByCampaign = new Map(
    sponsorGroups.map((row) => [row.campaignId, { amount: row._sum.amount || 0, count: row._count.id }]),
  )

  const personalizedCampaigns = campaigns
    .map((campaign) => {
      const sponsor = sponsorByCampaign.get(campaign.id)

      return {
        ...campaign,
        progress: campaignProgress(campaign),
        fundingGap: Math.max(campaign.goal - campaign.raised, 0),
        sponsorAmount: Number((sponsor?.amount || 0).toFixed(2)),
        sponsorDonationCount: sponsor?.count || 0,
      }
    })
    .sort((a, b) => {
      if (sortBy === "fundingGap") return b.fundingGap - a.fundingGap
      return 0
    })

  return NextResponse.json({
    campaigns: personalizedCampaigns,
    filters: { q, urgency, impactLevel, sortBy },
  })
}

export const GET = withAuth(handler, [UserRole.SPONSOR, UserRole.ADMIN])

