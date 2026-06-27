import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware/auth"
import { UserRole, EntityType } from "@prisma/client"
import { prisma } from "@/lib/database"
import { logAudit } from "@/lib/audit"

function ensureRole(role: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
}

async function getSettingsHandler(request: NextRequest & { user: any }) {
  try {
    const roleCheck = ensureRole(request.user.role, [UserRole.ADMIN])
    if (roleCheck) return roleCheck

    // Using raw query instead of prisma.setting.findMany due to Prisma client not being regenerated
    const settings: any = await prisma.$queryRaw`SELECT * FROM settings ORDER BY category ASC`;

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function createSettingsHandler(request: NextRequest & { user: any }) {
  try {
    const roleCheck = ensureRole(request.user.role, [UserRole.ADMIN])
    if (roleCheck) return roleCheck

    const body = await request.json()
    const { key, value, description, category } = body

    if (!key || !value) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
    }

    // Using raw query instead of prisma.setting.upsert due to Prisma client not being regenerated
    const existingSettings: any = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key}`;
    const existingSetting = Array.isArray(existingSettings) ? existingSettings[0] : existingSettings;
    
    let setting: any;
    if (existingSetting) {
      // Update existing setting
      await prisma.$executeRaw`
        UPDATE settings 
        SET value = ${value}, 
            description = ${description || null}, 
            category = ${category || "general"}, 
            updatedAt = NOW() 
        WHERE \`key\` = ${key}
      `;
      
      const updatedSettings: any = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key}`;
      setting = Array.isArray(updatedSettings) ? updatedSettings[0] : updatedSettings;
    } else {
      // Create new setting
      await prisma.$executeRaw`
        INSERT INTO settings (\`key\`, value, description, category, createdAt, updatedAt)
        VALUES (${key}, ${value}, ${description || null}, ${category || "general"}, NOW(), NOW())
      `;
      
      const newSettings: any = await prisma.$queryRaw`SELECT * FROM settings WHERE \`key\` = ${key}`;
      setting = Array.isArray(newSettings) ? newSettings[0] : newSettings;
    }

    await logAudit({
      entityType: "SETTING" as any,
      entityId: setting.id,
      action: "UPDATE",
      changedData: { key, value, description, category },
      performedById: request.user.userId
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const GET = withAuth(getSettingsHandler, [UserRole.ADMIN])
export const POST = withAuth(createSettingsHandler, [UserRole.ADMIN])