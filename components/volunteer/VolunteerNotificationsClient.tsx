"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCircle2, Info, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function iconFor(type: string) {
  if (type === "SUCCESS") return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (type === "WARNING") return <TriangleAlert className="h-4 w-4 text-amber-600" />
  return <Info className="h-4 w-4 text-blue-600" />
}

function getAuthHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  
  const accessToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('accessToken='))
    ?.split('=')[1];
    
  if (accessToken) {
    return { 'Authorization': `Bearer ${accessToken}` };
  }
  return {};
}

export default function VolunteerNotificationsClient() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadNotifications() {
      try {
        const response = await fetch("/api/dashboard/volunteer/notifications", {
          headers: getAuthHeaders(),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load notifications")
        }

        if (mounted) {
          setNotifications(result.notifications || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load notifications")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadNotifications()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Follow campaign updates, platform messages, and volunteer coordination notices.
        </p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex gap-3 p-4">
                <div className="mt-1">{iconFor(notification.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{notification.title}</p>
                    <Badge variant={notification.read ? "outline" : "secondary"}>
                      {notification.read ? "Read" : notification.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            No notifications yet.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
