import { CampaignStatus } from "@prisma/client"
import { prisma } from "@/lib/database"

export function sponsorMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function sponsorLastSixMonthKeys() {
  const now = new Date()
  const months: string[] = []

  for (let i = 5; i >= 0; i--) {
    months.push(sponsorMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }

  return months
}

export function campaignProgress(campaign: { goal: number; raised: number }) {
  if (!campaign.goal) return 0
  return Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100)
}

export async function getSponsorDashboard(userId: string) {
  const [
    user,
    recentDonations,
    donationRows,
    donationsByCampaignRaw,
    activeCampaignCount,
    completedCampaignCount,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
    }),
    prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
            startDate: true,
            endDate: true,
          },
        },
      },
      take: 8,
    }),
    prisma.donation.findMany({
      where: { userId },
      select: { id: true, amount: true, createdAt: true, campaignId: true },
    }),
    prisma.donation.groupBy({
      by: ["campaignId"],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
    prisma.campaign.count({ where: { status: CampaignStatus.COMPLETED } }),
  ])

  if (!user) {
    return null
  }

  const supportedCampaignIds = donationsByCampaignRaw.map((row) => row.campaignId)
  const campaigns = supportedCampaignIds.length
    ? await prisma.campaign.findMany({
        where: { id: { in: supportedCampaignIds } },
        select: {
          id: true,
          title: true,
          location: true,
          category: true,
          goal: true,
          raised: true,
          status: true,
        },
      })
    : []

  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]))
  const totalDonated = Number(donationRows.reduce((sum, donation) => sum + donation.amount, 0).toFixed(2))
  const averageDonation = donationRows.length ? Number((totalDonated / donationRows.length).toFixed(2)) : 0

  const months = sponsorLastSixMonthKeys()
  const amountByMonth: Record<string, number> = Object.fromEntries(months.map((month) => [month, 0]))

  for (const donation of donationRows) {
    const key = sponsorMonthKey(donation.createdAt)
    if (key in amountByMonth) {
      amountByMonth[key] += donation.amount
    }
  }

  const donationsByCampaign = donationsByCampaignRaw.map((row) => {
    const campaign = campaignById.get(row.campaignId)

    return {
      id: row.campaignId,
      name: campaign?.title || "Campaign",
      value: Number((row._sum.amount || 0).toFixed(2)),
      donationCount: row._count.id,
      location: campaign?.location || "Unknown",
      category: campaign?.category || "General",
      progress: campaign ? campaignProgress(campaign) : 0,
      status: campaign?.status || "ACTIVE",
    }
  })

  const suggestedCampaigns = await prisma.campaign.findMany({
    where: {
      status: CampaignStatus.ACTIVE,
      ...(supportedCampaignIds.length ? { id: { notIn: supportedCampaignIds } } : {}),
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
      _count: { select: { donations: true, volunteers: true } },
    },
    take: 6,
  })

  return {
    user,
    stats: {
      totalDonated,
      donationCount: donationRows.length,
      campaignsSupported: donationsByCampaign.length,
      averageDonation,
      activeCampaignCount,
      completedCampaignCount,
      lastDonation: recentDonations[0] || null,
    },
    series: {
      donationsByMonth: months.map((month) => ({
        month,
        amount: Number(amountByMonth[month].toFixed(2)),
      })),
      donationsByCampaign,
    },
    lists: {
      recentDonations,
      suggestedCampaigns: suggestedCampaigns.map((campaign) => ({
        ...campaign,
        progress: campaignProgress(campaign),
      })),
    },
  }
}

