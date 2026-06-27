import { prisma } from "@/lib/database"

export const volunteerDb = prisma as any

export type VolunteerCampaignStatus = "APPLIED" | "APPROVED" | "ACTIVE" | "COMPLETED" | "REJECTED"
export type VolunteerHourStatus = "PENDING" | "APPROVED" | "REJECTED"

export function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function lastSixMonthKeys() {
  const now = new Date()
  const months: string[] = []

  for (let i = 5; i >= 0; i--) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }

  return months
}

export function totalHours(rows: Array<{ hours: number }>) {
  return Number(rows.reduce((sum, row) => sum + row.hours, 0).toFixed(1))
}

export function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value !== "string") {
    return []
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeAvailability(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value
  }

  return {
    weekdays: false,
    weekends: false,
    mornings: false,
    afternoons: false,
    evenings: false,
  }
}
