import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AuthService } from "@/lib/auth"
import { UserRole } from "@prisma/client"
import BlogManager from "@/components/admin/BlogManager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = 'force-dynamic'

function ensureRole(role: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(role)) redirect("/auth/login")
}

export default async function AdminPostsPage() {
  const token = cookies().get("accessToken")?.value
  const payload = token ? await AuthService.verifyAccessToken(token) : null
  if (!payload) redirect("/auth/login")
  ensureRole(payload.role, [UserRole.ADMIN])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogManager />
        </CardContent>
      </Card>
    </div>
  )
}
