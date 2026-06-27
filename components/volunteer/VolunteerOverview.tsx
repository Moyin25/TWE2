"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, CalendarCheck, Clock3, Leaf, Search, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/dashboard/StatCard"
import { LineChart } from "@/components/dashboard/Charts"

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Flexible"
}

function progressValue(campaign: any) {
  if (!campaign?.goal) return 0
  return Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100)
}

export default function VolunteerOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard/volunteer", { credentials: "include" })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load volunteer dashboard")
        }

        if (mounted) {
          setData(result)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load volunteer dashboard")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [])

  const profileCompletion = useMemo(() => {
    if (!data?.profile) return 20
    const fields = ["bio", "location", "skills", "interests", "availability"]
    const completed = fields.filter((field) => {
      const value = data.profile[field]
      return Array.isArray(value) ? value.length > 0 : Boolean(value)
    }).length
    return Math.max(20, Math.round((completed / fields.length) * 100))
  }, [data])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading volunteer dashboard...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  const userName = data.user ? `${data.user.firstName} ${data.user.lastName}` : "Volunteer"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight">{userName}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track your campaign applications, approved activities, hours, and impact from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/volunteer/campaigns">
              <Search className="mr-2 h-4 w-4" />
              Find Campaigns
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/volunteer/hours">
              <Clock3 className="mr-2 h-4 w-4" />
              Log Hours
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Activities" value={data.stats.activeAssignments} subtitle={`${data.stats.applications} pending applications`} icon={<CalendarCheck className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Approved Hours" value={data.stats.approvedHours} subtitle={`${data.stats.pendingHours} hours pending review`} icon={<Clock3 className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Impact Score" value={data.stats.impactScore} subtitle={`${data.stats.completedCampaigns} completed campaigns`} icon={<Leaf className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Active Campaigns" value={data.stats.activeCampaignCount} subtitle="Available to join" icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Approved Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={data.series.hoursByMonth} xKey="month" yKey="hours" label="Hours" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Readiness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-medium">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} />
            </div>
            <p className="text-sm text-muted-foreground">
              A stronger profile helps coordinators match you with relevant campaign work.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/volunteer/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Activities</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/volunteer/my-activities">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lists.memberships.length ? data.lists.memberships.map((item: any) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.campaign.title}</p>
                    <p className="text-xs text-muted-foreground">{item.campaign.location} - {formatDate(item.campaign.startDate)}</p>
                  </div>
                  <Badge variant="secondary">{item.status}</Badge>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No activities yet. Find a campaign to get started.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recommended Campaigns</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lists.recommendedCampaigns.length ? data.lists.recommendedCampaigns.slice(0, 3).map((campaign: any) => (
              <div key={campaign.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{campaign.title}</p>
                    <p className="text-xs text-muted-foreground">{campaign.location} - {campaign.category}</p>
                  </div>
                  <Badge variant="outline">{campaign.urgency}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  <Progress value={progressValue(campaign)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{progressValue(campaign)}% funded</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No new recommendations right now.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
