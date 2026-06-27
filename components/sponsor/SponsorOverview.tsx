"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Gift, HandCoins, Search, Target, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/dashboard/StatCard"
import { DonutChart, LineChart } from "@/components/dashboard/Charts"

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not scheduled"
}

export default function SponsorOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard/sponsor", { credentials: "include" })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load sponsor dashboard")
        }

        if (mounted) setData(result)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load sponsor dashboard")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDashboard()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading sponsor dashboard...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  const userName = data.user ? `${data.user.firstName} ${data.user.lastName}` : "Sponsor"
  const hasDonations = data.stats.donationCount > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-tight">{userName}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review your giving history, understand where your support is going, and find campaigns that need funding.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/sponsor/campaigns">
              <Search className="mr-2 h-4 w-4" />
              Find Campaigns
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/sponsor/donations">
              <Gift className="mr-2 h-4 w-4" />
              Donation History
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Donated"
          value={currency(data.stats.totalDonated)}
          subtitle={`${data.stats.donationCount} lifetime donations`}
          icon={<HandCoins className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Supported Campaigns"
          value={data.stats.campaignsSupported}
          subtitle={`${data.stats.activeCampaignCount} active campaigns available`}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Average Gift"
          value={currency(data.stats.averageDonation)}
          subtitle="Across all sponsor donations"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Completed Campaigns"
          value={data.stats.completedCampaignCount}
          subtitle="Organization-wide campaign outcomes"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Giving Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={data.series.donationsByMonth} xKey="month" yKey="amount" label="Amount" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {hasDonations && data.series.donationsByCampaign.length ? (
              <DonutChart data={data.series.donationsByCampaign} nameKey="name" valueKey="value" />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Your campaign allocation will appear after your first donation.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Donations</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/sponsor/donations">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lists.recentDonations.length ? (
              data.lists.recentDonations.map((donation: any) => (
                <div key={donation.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{donation.campaign.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {donation.campaign.location} - {formatDate(donation.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{currency(donation.amount)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No donations yet. Browse active campaigns to begin supporting climate work.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Suggested Campaigns</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/sponsor/campaigns">Browse</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lists.suggestedCampaigns.length ? (
              data.lists.suggestedCampaigns.slice(0, 3).map((campaign: any) => (
                <div key={campaign.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.location} - {campaign.category}
                      </p>
                    </div>
                    <Badge variant="outline">{campaign.urgency}</Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Progress value={campaign.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {currency(campaign.raised)} raised of {currency(campaign.goal)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No new campaign recommendations right now.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

