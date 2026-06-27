"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CampaignInlineEditor } from "./CampaignInlineEditor"

type Campaign = {
  id: string
  title: string
  description: string
  content: string
  image?: string | null
  goal: number
  raised: number
  category: string
  location: string
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  startDate?: string | null
  endDate?: string | null
  urgency: "HIGH" | "MEDIUM" | "LOW"
  impactLevel: "INTERNATIONAL" | "NATIONAL" | "REGIONAL" | "LOCAL"
  createdAt: string
  createdBy: { id: string; firstName: string; lastName: string; email: string }
  _count?: { donations: number }
}

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [form, setForm] = useState({
    title: "",
    description: "",
    content: "",
    image: "",
    goal: 0,
    category: "General",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    status: "DRAFT" as Campaign["status"],
    urgency: "MEDIUM" as Campaign["urgency"],
    impactLevel: "REGIONAL" as Campaign["impactLevel"]
  })
  const [status, setStatus] = useState<Campaign["status"] | "ALL">("ALL")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [urgency, setUrgency] = useState<Campaign["urgency"] | "ALL">("ALL")
  const [impactLevel, setImpactLevel] = useState<Campaign["impactLevel"] | "ALL">("ALL")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'goal'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'ALL') params.set('status', status)
      if (category) params.set('category', category)
      if (location) params.set('location', location)
      if (urgency !== 'ALL') params.set('urgency', urgency)
      if (impactLevel !== 'ALL') params.set('impactLevel', impactLevel)
      if (q) params.set('q', q)
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      const res = await fetch(`/api/admin/campaigns?${params.toString()}`)
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/auth/login'
          return
        }
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setCampaigns(data.campaigns || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load() 
  }, [status, category, location, urgency, impactLevel, page, sortBy, sortOrder])
  
  useEffect(() => { 
    const t = setTimeout(()=>{ 
      setPage(1); 
      load() 
    }, 300); 
    return () => clearTimeout(t) 
  }, [q])

  async function handleSave(campaignId: string, data: any) {
    setSavingIds(prev => new Set([...prev, campaignId]))
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        await load()
        setEditingId(null)
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update campaign')
      }
    } catch (error) {
      console.error('Save failed:', error)
      throw error
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev)
        next.delete(campaignId)
        return next
      })
    }
  }

  async function handleDelete(campaignId: string) {
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await load()
      } else {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      throw error
    }
  }

  async function createCampaign() {
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, goal: Number(form.goal) }),
    })
    if (res.ok) {
      setForm({
        title: "",
        description: "",
        content: "",
        image: "",
        goal: 0,
        category: "General",
        location: "",
        latitude: null,
        longitude: null,
        status: "DRAFT",
        urgency: "MEDIUM",
        impactLevel: "REGIONAL"
      })
      await load()
    }
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Create Campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <div className="flex gap-2">
            <Input type="number" step="any" placeholder="Latitude" value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: e.target.value ? Number(e.target.value) : null })} />
            <Input type="number" step="any" placeholder="Longitude" value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <Input type="number" placeholder="Goal (USD)" value={form.goal} onChange={(e) => setForm({ ...form, goal: Number(e.target.value) })} />
          <div className="flex gap-2">
            <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <input id="campaign-image-file" type="file" accept="image/*" className="hidden" title="Upload campaign image" onChange={async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              try {
                const fd = new FormData(); fd.append('file', file)
                const up = await fetch('/api/admin/gallery/upload', { method: 'POST', body: fd })
                const json = await up.json()
                if (up.ok && json.url) setForm(f => ({ ...f, image: json.url }))
              } catch {}
            }} />
            <Button type="button" variant="outline" onClick={() => document.getElementById('campaign-image-file')?.click()}>Upload</Button>
          </div>
          
          <Textarea placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="min-h-32" />
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Campaign["status"] })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as Campaign["urgency"] })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Urgency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={form.impactLevel} onValueChange={(v) => setForm({ ...form, impactLevel: v as Campaign["impactLevel"] })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Impact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNATIONAL">International</SelectItem>
                <SelectItem value="NATIONAL">National</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
                <SelectItem value="LOCAL">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={createCampaign} disabled={loading || !form.title || !form.description || !form.content || !form.location || !form.goal}>Create</Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            {/* First row - Main filters */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Select value={status} onValueChange={(v) => setStatus(v as Campaign["status"] | 'ALL')}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Campaign["urgency"] | 'ALL')}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Urgency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Urgency</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={impactLevel} onValueChange={(v) => setImpactLevel(v as Campaign["impactLevel"] | 'ALL')}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Impact" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Impact</SelectItem>
                  <SelectItem value="INTERNATIONAL">International</SelectItem>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="REGIONAL">Regional</SelectItem>
                  <SelectItem value="LOCAL">Local</SelectItem>
                </SelectContent>
              </Select>
              
              <Input placeholder="Search campaigns..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            
            {/* Second row - Secondary filters and sorting */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Input placeholder="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} />
              <Input placeholder="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} />
              
              <Select value={sortBy} onValueChange={(v:any)=>setSortBy(v)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="goal">Goal</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOrder} onValueChange={(v:any)=>setSortOrder(v)}>
                <SelectTrigger className="w-28"><SelectValue placeholder="Order" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {loading ? <p>Loading campaigns...</p> : null}
          
          <div className="space-y-0">
            {campaigns.map((c) => (
              <CampaignInlineEditor
                key={c.id}
                campaign={c}
                onSave={(data: any) => handleSave(c.id, data)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDelete(c.id)}
                isSaving={savingIds.has(c.id)}
              />
            ))}
          </div>
          
          {campaigns.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns found matching your criteria.
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {campaigns.length} campaigns
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
              <div className="text-sm text-muted-foreground self-center px-3">Page {page} of {totalPages}</div>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
