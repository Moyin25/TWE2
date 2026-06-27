"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Clock3, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { StatCard } from "@/components/dashboard/StatCard"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function VolunteerHoursClient() {
  const [hours, setHours] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [totals, setTotals] = useState({ approved: 0, pending: 0, rejected: 0, visible: 0 })
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({ campaignId: "", hours: "", loggedAt: today(), note: "" })

  const eligibleActivities = useMemo(
    () => activities.filter((item) => ["APPROVED", "ACTIVE", "COMPLETED"].includes(item.status)),
    [activities],
  )

  async function loadHours(nextStatus = status) {
    setLoading(true)
    setError("")

    try {
      const [hoursResponse, activitiesResponse] = await Promise.all([
        fetch(`/api/dashboard/volunteer/hours?status=${nextStatus}`),
        fetch("/api/dashboard/volunteer/activities"),
      ])

      const hoursResult = await hoursResponse.json()
      const activitiesResult = await activitiesResponse.json()

      if (!hoursResponse.ok) throw new Error(hoursResult.error || "Failed to load hours")
      if (!activitiesResponse.ok) throw new Error(activitiesResult.error || "Failed to load activities")

      setHours(hoursResult.hours || [])
      setTotals(hoursResult.totals || { approved: 0, pending: 0, rejected: 0, visible: 0 })
      setActivities(activitiesResult.activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hours")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHours(status)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  async function submitHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/volunteer/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: form.campaignId,
          hours: form.hours,
          loggedAt: form.loggedAt,
          note: form.note,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit hours")
      }

      setMessage(result.message || "Hours submitted")
      setForm({ campaignId: "", hours: "", loggedAt: today(), note: "" })
      await loadHours(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit hours")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Volunteer Hours</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Submit hours for approved activities and track review status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Approved" value={totals.approved} subtitle="Confirmed contribution hours" icon={<Clock3 className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Pending" value={totals.pending} subtitle="Awaiting review" icon={<Clock3 className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Rejected" value={totals.rejected} subtitle="Needs correction" icon={<Clock3 className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Log Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitHours}>
              <div className="space-y-2">
                <Label>Campaign</Label>
                <Select value={form.campaignId} onValueChange={(value) => setForm((current) => ({ ...current, campaignId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select an approved activity" /></SelectTrigger>
                  <SelectContent>
                    {eligibleActivities.map((activity) => (
                      <SelectItem key={activity.campaignId} value={activity.campaignId}>
                        {activity.campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input id="hours" type="number" min="0.25" max="24" step="0.25" value={form.hours} onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loggedAt">Date</Label>
                  <Input id="loggedAt" type="date" value={form.loggedAt} onChange={(event) => setForm((current) => ({ ...current, loggedAt: event.target.value }))} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Textarea id="note" rows={4} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="What did you work on?" />
              </div>

              {eligibleActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">You need an approved activity before logging hours.</p>
              ) : null}

              <Button className="w-full" disabled={saving || eligibleActivities.length === 0}>
                <Send className="mr-2 h-4 w-4" />
                {saving ? "Submitting..." : "Submit for Review"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Hour Logs</CardTitle>
            <div className="w-44">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {message ? <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div> : null}
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            {loading ? (
              <p className="text-sm text-muted-foreground">Loading hour logs...</p>
            ) : hours.length ? (
              hours.map((item) => (
                <div key={item.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.campaign?.title || "General volunteer work"}</p>
                      <p className="text-sm text-muted-foreground">{new Date(item.loggedAt).toLocaleDateString()} - {item.hours} hours</p>
                      {item.note ? <p className="mt-2 text-sm text-muted-foreground">{item.note}</p> : null}
                    </div>
                    <Badge variant={item.status === "REJECTED" ? "destructive" : "secondary"}>{item.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hour logs found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
