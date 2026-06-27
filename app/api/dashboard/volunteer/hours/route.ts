import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { withAuth } from "@/lib/middleware/auth"
import { totalHours, volunteerDb } from "@/lib/volunteer-dashboard"

type VolunteerRequest = NextRequest & {
  user: {
    userId: string
    role: UserRole
  }
}

export const dynamic = "force-dynamic"

async function getHoursHandler(request: VolunteerRequest) {
  const userId = request.user.userId
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")

  const where: any = { userId }
  if (status && status !== "all") {
    where.status = status
  }

  const [hours, approved, pending, rejected] = await Promise.all([
    volunteerDb.volunteerHour.findMany({
      where,
      orderBy: { loggedAt: "desc" },
      include: { campaign: { select: { id: true, title: true, location: true } } },
    }),
    volunteerDb.volunteerHour.findMany({ where: { userId, status: "APPROVED" }, select: { hours: true } }),
    volunteerDb.volunteerHour.findMany({ where: { userId, status: "PENDING" }, select: { hours: true } }),
    volunteerDb.volunteerHour.findMany({ where: { userId, status: "REJECTED" }, select: { hours: true } }),
  ])

  return NextResponse.json({
    hours,
    totals: {
      approved: totalHours(approved),
      pending: totalHours(pending),
      rejected: totalHours(rejected),
      visible: totalHours(hours),
    },
  })
}

async function createHoursHandler(request: VolunteerRequest) {
  const userId = request.user.userId
  const body = await request.json()
  const campaignId = typeof body.campaignId === "string" && body.campaignId ? body.campaignId : null
  const hours = Number(body.hours)
  const note = typeof body.note === "string" ? body.note.trim() : null
  const loggedAt = body.loggedAt ? new Date(body.loggedAt) : new Date()

  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    return NextResponse.json({ error: "Hours must be a number between 0 and 24" }, { status: 400 })
  }

  if (Number.isNaN(loggedAt.getTime())) {
    return NextResponse.json({ error: "Please provide a valid date" }, { status: 400 })
  }

  if (campaignId) {
    const membership = await volunteerDb.volunteerCampaign.findUnique({
      where: { userId_campaignId: { userId, campaignId } },
    })

    if (!membership || !["APPROVED", "ACTIVE", "COMPLETED"].includes(membership.status)) {
      return NextResponse.json({ error: "You can only log hours for approved volunteer activities" }, { status: 403 })
    }
  }

  const hourLog = await volunteerDb.volunteerHour.create({
    data: { userId, campaignId, hours, note, loggedAt, status: "PENDING" },
    include: { campaign: { select: { id: true, title: true, location: true } } },
  })

  return NextResponse.json({ message: "Volunteer hours submitted for review", hourLog }, { status: 201 })
}

export const GET = withAuth(getHoursHandler, [UserRole.VOLUNTEER, UserRole.ADMIN])
export const POST = withAuth(createHoursHandler, [UserRole.VOLUNTEER, UserRole.ADMIN])
