import { NextRequest, NextResponse } from "next/server"
import { UserRole } from "@prisma/client"
import { prisma } from "@/lib/database"
import { withAuth } from "@/lib/middleware/auth"

export const dynamic = "force-dynamic"

async function handler() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ notifications })
}

export const GET = withAuth(handler, [UserRole.VOLUNTEER, UserRole.ADMIN])
