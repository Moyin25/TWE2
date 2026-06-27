import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import GalleryClient from "./GalleryClient"

export const dynamic = 'force-dynamic'

function ensureRole(role: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(role)) redirect("/auth/login")
}

export default async function AdminGalleryPage() {
  const token = cookies().get("accessToken")?.value
  const payload = token ? await AuthService.verifyAccessToken(token) : null
  if (!payload) redirect("/auth/login")
  ensureRole(payload.role, [UserRole.ADMIN])

  return <GalleryClient userEmail={payload.email} />
}
