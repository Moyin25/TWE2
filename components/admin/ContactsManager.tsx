"use client"

'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"

type Contact = {
  id: string
  name: string
  email: string
  phone?: string | null
  organization?: string | null
  subject: string
  message: string
  inquiryType: string
  status: ContactStatus
  createdAt: string
}

export default function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ContactStatus | "ALL">("NEW")
  const [q, setQ] = useState("")

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== "ALL") params.set("status", status)
      if (q) params.set("q", q)
      const res = await fetch(`/api/admin/contacts?${params.toString()}`)
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/auth/login'
          return
        }
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setContacts(data.contacts || [])
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  async function update(id: string, patch: Partial<Contact>) {
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    await load()
  }

  async function remove(id: string) {
    await fetch(`/api/admin/contacts/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <Select value={status} onValueChange={(v) => setStatus(v as ContactStatus | 'ALL')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search name/email/subject" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p>Loading...</p> : null}
          {contacts.map((c) => (
            <div key={c.id} className="border-b last:border-b-0 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{c.name}</h3>
                    <Badge variant="secondary">{c.inquiryType}</Badge>
                    <Badge>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.email} {c.phone ? `• ${c.phone}` : ''} {c.organization ? `• ${c.organization}` : ''}</p>
                  <p className="text-sm mt-1"><span className="font-medium">{c.subject}:</span> {c.message}</p>
                </div>
                <div className="flex gap-2">
                  {c.status !== 'IN_PROGRESS' && <Button size="sm" variant="outline" onClick={() => update(c.id, { status: 'IN_PROGRESS' })}>In Progress</Button>}
                  {c.status !== 'RESOLVED' && <Button size="sm" variant="outline" onClick={() => update(c.id, { status: 'RESOLVED' })}>Resolve</Button>}
                  {c.status !== 'ARCHIVED' && <Button size="sm" variant="outline" onClick={() => update(c.id, { status: 'ARCHIVED' })}>Archive</Button>}
                  <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>Delete</Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(c.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
