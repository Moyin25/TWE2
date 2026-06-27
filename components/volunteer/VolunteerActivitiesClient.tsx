"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CalendarCheck, Clock3, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Flexible"
}

function progressValue(campaign: any) {
  if (!campaign?.goal) return 0
  return Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100)
}

export default function VolunteerActivitiesClient() {
  const [activities, setActivities] = useState<any[]>([])
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadActivities() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/dashboard/volunteer/activities?status=${status}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load activities")
        }

        if (mounted) {
          setActivities(result.activities || [])
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load activities")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadActivities()
    return () => {
      mounted = false
    }
  }, [status])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Activities</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review campaigns you applied to, joined, completed, or need action on.
          </p>
        </div>
        <div className="w-full md:w-56">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activities</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading activities...</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{activity.campaign.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{activity.campaign.description}</p>
                  </div>
                  <Badge variant="secondary">{activity.status}</Badge>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {activity.campaign.location}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4" />
                    {formatDate(activity.campaign.startDate)}
                  </p>
                </div>

                <div className="space-y-1">
                  <Progress value={progressValue(activity.campaign)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progressValue(activity.campaign)}% funded</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{activity.campaign.category}</Badge>
                  <Badge variant="outline">{activity.campaign.urgency}</Badge>
                  <Badge variant="outline">{activity.campaign.impactLevel}</Badge>
                </div>

                {["APPROVED", "ACTIVE", "COMPLETED"].includes(activity.status) ? (
                  <Button asChild>
                    <Link href="/dashboard/volunteer/hours">
                      <Clock3 className="mr-2 h-4 w-4" />
                      Log Hours
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && activities.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No activities found for this status. Browse campaigns to submit your first application.
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
