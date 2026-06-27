import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/database"
import { withAuth } from "@/lib/middleware/auth"

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
  const sortBy = searchParams.get("sortBy") || "createdAt"

  const where: any = { userId }

  if (q) {
    where.campaign = {
      OR: [
        { title: { contains: q } },
        { category: { contains: q } },
        { location: { contains: q } },
      ],
    }
  }

  const orderBy =
    sortBy === "amount"
      ? { amount: "desc" as const }
      : sortBy === "campaign"
        ? { campaign: { title: "asc" as const } }
        : { createdAt: "desc" as const }

  const [donations, allDonations, campaignGroups] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            location: true,
            category: true,
            goal: true,
            raised: true,
            status: true,
          },
        },
      },
      take: 50,
    }),
    prisma.donation.findMany({ where: { userId }, select: { amount: true } }),
    prisma.donation.groupBy({ by: ["campaignId"], where: { userId }, _count: { id: true } }),
  ])

  const totalDonated = Number(allDonations.reduce((sum, donation) => sum + donation.amount, 0).toFixed(2))
  const donationCount = allDonations.length

  return NextResponse.json({
    donations,
    filters: { q, sortBy },
    summary: {
      totalDonated,
      donationCount,
      campaignsSupported: campaignGroups.length,
      averageDonation: donationCount ? Number((totalDonated / donationCount).toFixed(2)) : 0,
    },
  })
}

export const GET = withAuth(handler, [UserRole.SPONSOR, UserRole.ADMIN])

