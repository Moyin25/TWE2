"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Filter, MapPin, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

function campaignProgress(campaign: any) {
  if (!campaign.goal) return 0
  return Math.min(Math.round((campaign.raised / campaign.goal) * 100), 100)
}

export default function VolunteerCampaignsClient() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [noteByCampaign, setNoteByCampaign] = useState<Record<string, string>>({})
  const [filters, setFilters] = useState({
    q: "",
    category: "all",
    urgency: "all",
    impactLevel: "all",
    sortBy: "createdAt",
  })

  async function loadCampaigns() {
    setLoading(true)
    setError("")
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    try {
      const response = await fetch(`/api/dashboard/volunteer/campaigns?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load campaigns")
      }

      setCampaigns(result.campaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.urgency, filters.impactLevel, filters.sortBy])

  async function applyToCampaign(campaignId: string) {
    setSavingId(campaignId)
    setError("")
    setMessage("")

    try {
      const response = await fetch(`/api/dashboard/volunteer/campaigns/${campaignId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteByCampaign[campaignId] || "" }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to apply")
      }

      setMessage(result.message || "Application submitted")
      await loadCampaigns()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply")
    } finally {
      setSavingId("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Find active campaigns and submit volunteer applications.
          </p>
        </div>
        <Button onClick={loadCampaigns} variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="campaign-search">Search</Label>
            <Input
              id="campaign-search"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadCampaigns()
              }}
              placeholder="Search title, category, location"
            />
          </div>
          <div className="space-y-2">
            <Label>Urgency</Label>
            <Select value={filters.urgency} onValueChange={(value) => setFilters((current) => ({ ...current, urgency: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Impact</Label>
            <Select value={filters.impactLevel} onValueChange={(value) => setFilters((current) => ({ ...current, impactLevel: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="LOCAL">Local</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
                <SelectItem value="NATIONAL">National</SelectItem>
                <SelectItem value="INTERNATIONAL">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort</Label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="startDate">Start date</SelectItem>
                <SelectItem value="goal">Funding goal</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {message ? <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div> : null}
      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading campaigns...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden">
              <div className="relative aspect-[16/9] bg-muted">
                <Image src={campaign.image || "/placeholder.jpg"} alt={campaign.title} fill className="object-cover" />
              </div>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold">{campaign.title}</h2>
                    <Badge variant={campaign.volunteerStatus ? "secondary" : "outline"}>
                      {campaign.volunteerStatus || campaign.urgency}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.description}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {campaign.location}
                  </p>
                </div>

                <div className="space-y-1">
                  <Progress value={campaignProgress(campaign)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    ${campaign.raised.toLocaleString()} raised of ${campaign.goal.toLocaleString()}
                  </p>
                </div>

                {!campaign.volunteerStatus ? (
                  <div className="space-y-2">
                    <Textarea
                      value={noteByCampaign[campaign.id] || ""}
                      onChange={(event) => setNoteByCampaign((current) => ({ ...current, [campaign.id]: event.target.value }))}
                      placeholder="Share your interest or relevant experience"
                      rows={3}
                    />
                    <Button className="w-full" onClick={() => applyToCampaign(campaign.id)} disabled={savingId === campaign.id}>
                      {savingId === campaign.id ? "Submitting..." : "Apply to Volunteer"}
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Application Status: {campaign.volunteerStatus}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No active campaigns match your filters.</CardContent>
        </Card>
      ) : null}
    </div>
  )
}
