"use client"

import { useEffect, useState } from "react"
import { Award, CalendarCheck, Clock3, Leaf } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/dashboard/StatCard"
import { LineChart } from "@/components/dashboard/Charts"

export default function VolunteerImpactClient() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadImpact() {
      try {
        const response = await fetch("/api/dashboard/volunteer")
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load impact")
        }

        if (mounted) {
          setData(result)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load impact")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadImpact()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading impact...</p>
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
  }

  const nextMilestone = Math.max(25, Math.ceil((data.stats.approvedHours + 1) / 25) * 25)
  const milestoneProgress = Math.min(Math.round((data.stats.approvedHours / nextMilestone) * 100), 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Impact</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          See the measurable contribution you are building through approved volunteer work.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Impact Score" value={data.stats.impactScore} subtitle="Built from hours and campaign progress" icon={<Leaf className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Approved Hours" value={data.stats.approvedHours} subtitle="Confirmed by coordinators" icon={<Clock3 className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Active Activities" value={data.stats.activeAssignments} subtitle="Approved or in progress" icon={<CalendarCheck className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Completed" value={data.stats.completedCampaigns} subtitle="Campaign participation records" icon={<Award className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hours Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={data.series.hoursByMonth} xKey="month" yKey="hours" label="Hours" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Milestone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{data.stats.approvedHours} of {nextMilestone} hours</span>
                <span className="font-medium">{milestoneProgress}%</span>
              </div>
              <Progress value={milestoneProgress} />
            </div>
            <p className="text-sm text-muted-foreground">
              Keep submitting reviewed hours to unlock stronger contribution records.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Contribution</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.lists.memberships.length ? data.lists.memberships.map((item: any) => (
            <div key={item.id} className="rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.campaign.title}</p>
                  <p className="text-sm text-muted-foreground">{item.campaign.location}</p>
                </div>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No campaign contributions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
