import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/database"
import { withAuth } from "@/lib/middleware/auth"
import { normalizeAvailability, splitList, volunteerDb } from "@/lib/volunteer-dashboard"

type VolunteerRequest = NextRequest & {
  user: {
    userId: string
    role: UserRole
  }
}

export const dynamic = "force-dynamic"

async function getProfileHandler(request: VolunteerRequest) {
  const userId = request.user.userId

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true },
    }),
    volunteerDb.volunteerProfile.findUnique({ where: { userId } }),
  ])

  return NextResponse.json({ user, profile })
}

async function updateProfileHandler(request: VolunteerRequest) {
  const userId = request.user.userId
  const body = await request.json()

  const bio = typeof body.bio === "string" ? body.bio.trim() : null
  const location = typeof body.location === "string" ? body.location.trim() : null
  const skills = splitList(body.skills)
  const interests = splitList(body.interests)
  const availability = normalizeAvailability(body.availability)

  const profile = await volunteerDb.volunteerProfile.upsert({
    where: { userId },
    create: { userId, bio, location, skills, interests, availability },
    update: { bio, location, skills, interests, availability },
  })

  return NextResponse.json({ message: "Volunteer profile updated", profile })
}

export const GET = withAuth(getProfileHandler, [UserRole.VOLUNTEER, UserRole.ADMIN])
export const PUT = withAuth(updateProfileHandler, [UserRole.VOLUNTEER, UserRole.ADMIN])
