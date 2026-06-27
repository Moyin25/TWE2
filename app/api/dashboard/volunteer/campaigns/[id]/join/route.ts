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

async function handler(request: VolunteerRequest, context: { params: { id: string } }) {
  const userId = request.user.userId
  const campaignId = context.params.id
  const body = await request.json().catch(() => ({}))
  const note = typeof body.note === "string" ? body.note.trim() : null

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, status: true, title: true },
  })

  if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
    return NextResponse.json({ error: "Campaign is not available for volunteers" }, { status: 404 })
  }

  const existingMembership = await volunteerDb.volunteerCampaign.findUnique({
    where: { userId_campaignId: { userId, campaignId } },
    include: { campaign: { select: { id: true, title: true, location: true, category: true } } },
  })

  if (existingMembership && existingMembership.status !== "REJECTED") {
    return NextResponse.json({
      message: "You have already applied for this campaign",
      membership: existingMembership,
    })
  }

  const membership = existingMembership
    ? await volunteerDb.volunteerCampaign.update({
        where: { id: existingMembership.id },
        data: { note, status: "APPLIED" },
        include: { campaign: { select: { id: true, title: true, location: true, category: true } } },
      })
    : await volunteerDb.volunteerCampaign.create({
        data: { userId, campaignId, note, status: "APPLIED" },
        include: { campaign: { select: { id: true, title: true, location: true, category: true } } },
      })

  return NextResponse.json({
    message: `Application submitted for ${campaign.title}`,
    membership,
  }, { status: 201 })
}

export const POST = withAuth(handler, [UserRole.VOLUNTEER, UserRole.ADMIN])
