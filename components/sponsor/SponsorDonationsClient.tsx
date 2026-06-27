"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Gift, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard } from "@/components/dashboard/StatCard"

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0)
}

export default function SponsorDonationsClient() {
  const [donations, setDonations] = useState<any[]>([])
  const [summary, setSummary] = useState({ totalDonated: 0, donationCount: 0, campaignsSupported: 0, averageDonation: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({ q: "", sortBy: "createdAt" })

  async function loadDonations() {
    setLoading(true)
    setError("")

    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    try {
      const response = await fetch(`/api/dashboard/sponsor/donations?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) throw new Error(result.error || "Failed to load donations")

      setDonations(result.donations || [])
      setSummary(result.summary || summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load donations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDonations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy])

  const largestDonation = useMemo(
    () => donations.reduce((largest, donation) => Math.max(largest, donation.amount), 0),
    [donations],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Donation History</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Audit every sponsor gift and see which campaigns your funding supported.
          </p>
        </div>
        <Button onClick={loadDonations} variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Donated" value={currency(summary.totalDonated)} subtitle="Lifetime giving" icon={<Gift className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Donation Count" value={summary.donationCount} subtitle="Recorded sponsor gifts" icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Campaigns Supported" value={summary.campaignsSupported} subtitle="Distinct campaigns funded" icon={<Gift className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Largest Gift" value={currency(largestDonation)} subtitle={`Average ${currency(summary.averageDonation)}`} icon={<Gift className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="donation-search">Search</Label>
            <Input
              id="donation-search"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadDonations()
              }}
              placeholder="Campaign title, category, or location"
            />
          </div>
          <div className="space-y-2">
            <Label>Sort</Label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Newest</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Donations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading donations...</p>
          ) : donations.length ? (
            donations.map((donation) => (
              <div key={donation.id} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{donation.campaign.title}</p>
                      <Badge variant="secondary">{donation.campaign.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {donation.campaign.location} - {donation.campaign.category}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-lg font-semibold">{currency(donation.amount)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No donations match your filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

