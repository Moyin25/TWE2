import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { withAuth } from '@/lib/middleware/auth'
import { UserRole, CampaignStatus, PostStatus } from '@prisma/client'

// Disable static generation for this route since it uses authentication headers
export const dynamic = 'force-dynamic';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

async function handler(request: NextRequest) {
  const [totalUsers, volunteers, sponsors, admins, totalCampaigns, activeCampaigns, draftCampaigns, completedCampaigns, publishedPosts, draftPosts, totalDonationsAgg, recentDonations, recentUsers, donationRows, donationsByCampaign] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VOLUNTEER' } }),
    prisma.user.count({ where: { role: 'SPONSOR' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
    prisma.campaign.count({ where: { status: CampaignStatus.DRAFT } }),
    prisma.campaign.count({ where: { status: CampaignStatus.COMPLETED } }),
    prisma.blogPost.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.blogPost.count({ where: { status: PostStatus.DRAFT } }),
    prisma.donation.aggregate({ _sum: { amount: true } }),
    prisma.donation.findMany({ include: { user: true, campaign: true }, orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true } }),
    prisma.donation.findMany({ select: { amount: true, createdAt: true } }),
    prisma.donation.groupBy({ by: ['campaignId'], _sum: { amount: true } }),
  ])

  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(monthKey(d))
  }
  const byMonth: Record<string, number> = Object.fromEntries(months.map((m) => [m, 0]))
  for (const row of donationRows) {
    const key = monthKey(row.createdAt)
    if (key in byMonth) byMonth[key] += row.amount
  }
  const donationsSeries = months.map((m) => ({ month: m, amount: Number(byMonth[m].toFixed(2)) }))

  const campaignMap = new Map<string, { title: string | null }>()
  const campaignIds = donationsByCampaign.map((d) => d.campaignId)
  const campaigns = await prisma.campaign.findMany({ where: { id: { in: campaignIds } }, select: { id: true, title: true } })
  campaigns.forEach((c) => campaignMap.set(c.id, { title: c.title }))
  const topCampaigns = donationsByCampaign
    .map((d) => ({ name: campaignMap.get(d.campaignId)?.title || d.campaignId, value: Number((d._sum.amount || 0).toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return NextResponse.json({
    stats: {
      totalUsers,
      volunteers,
      sponsors,
      admins,
      totalCampaigns,
      activeCampaigns,
      draftCampaigns,
      completedCampaigns,
      publishedPosts,
      draftPosts,
      totalDonations: Number(totalDonationsAgg._sum.amount || 0),
    },
    recentDonations,
    recentUsers,
    donationsSeries,
    topCampaigns,
  })
}

export const GET = withAuth(handler, [UserRole.ADMIN])