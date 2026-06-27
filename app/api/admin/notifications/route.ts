import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { withAuth } from "@/lib/middleware/auth";
import { UserRole } from "@prisma/client";

async function getNotificationsHandler(request: NextRequest) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function createNotificationHandler(request: NextRequest) {
  try {
    const { title, description, type } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        description,
        type: type || "INFO",
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getNotificationsHandler, [UserRole.ADMIN]);
export const POST = withAuth(createNotificationHandler, [UserRole.ADMIN]);