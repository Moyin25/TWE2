import { NextRequest, NextResponse } from "next/server"
import { CampaignStatus, UserRole } from "@prisma/client"
import { prisma } from "@/lib/database"
import { withAuth } from "@/lib/middleware/auth"
import { lastSixMonthKeys, monthKey, totalHours, volunteerDb } from "@/lib/volunteer-dashboard"

type VolunteerRequest = NextRequest & {
  user: {
    userId: string
    email: string
    role: UserRole
  }
}

export const dynamic = "force-dynamic"

async function handler(request: VolunteerRequest) {
  const userId = request.user.userId

  const [
    user,
    profile,
    activeCampaignCount,
    memberships,
    recentHours,
    approvedHourRows,
    pendingHourCount,
    userDonations,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
    }),
    volunteerDb.volunteerProfile.findUnique({ where: { userId } }),
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
    volunteerDb.volunteerCampaign.findMany({
      where: { userId },
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
            status: true,
            urgency: true,
            impactLevel: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      take: 6,
    }),
    volunteerDb.volunteerHour.findMany({
      where: { userId },
      orderBy: { loggedAt: "desc" },
      include: { campaign: { select: { id: true, title: true, location: true } } },
      take: 6,
    }),
    volunteerDb.volunteerHour.findMany({
      where: { userId, status: "APPROVED" },
      select: { hours: true, loggedAt: true },
    }),
    volunteerDb.volunteerHour.count({ where: { userId, status: "PENDING" } }),
    prisma.donation.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 }),
  ])

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const joinedCampaignIds = memberships.map((item: any) => item.campaignId)
  const recommendedCampaigns = await prisma.campaign.findMany({
    where: {
      status: CampaignStatus.ACTIVE,
      ...(joinedCampaignIds.length ? { id: { notIn: joinedCampaignIds } } : {}),
    },
    orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
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
      _count: { select: { donations: true } },
    },
    take: 6,
  })

  const months = lastSixMonthKeys()
  const hoursByMonth = Object.fromEntries(months.map((month) => [month, 0]))
  for (const row of approvedHourRows) {
    const key = monthKey(row.loggedAt)
    if (key in hoursByMonth) {
      hoursByMonth[key] += row.hours
    }
  }

  const approvedHours = totalHours(approvedHourRows)
  const activeAssignments = memberships.filter((item: any) => ["APPROVED", "ACTIVE"].includes(item.status)).length
  const completedCampaigns = memberships.filter((item: any) => item.status === "COMPLETED").length
  const totalDonated = Number(userDonations.reduce((sum, donation) => sum + donation.amount, 0).toFixed(2))
  const impactScore = Math.round(approvedHours * 2 + activeAssignments * 15 + completedCampaigns * 25)

  return NextResponse.json({
    user,
    profile,
    stats: {
      activeCampaignCount,
      activeAssignments,
      applications: memberships.filter((item: any) => item.status === "APPLIED").length,
      completedCampaigns,
      pendingHours: pendingHourCount,
      approvedHours,
      impactScore,
      donations: { total: totalDonated, count: userDonations.length },
    },
    series: {
      hoursByMonth: months.map((month) => ({ month, hours: Number(hoursByMonth[month].toFixed(1)) })),
    },
    lists: {
      memberships,
      recommendedCampaigns,
      recentHours,
      donations: userDonations,
    },
  })
}

export const GET = withAuth(handler, [UserRole.VOLUNTEER, UserRole.ADMIN])
