"use client"

'use client'

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter } from "lucide-react"

export type Role = "VOLUNTEER" | "SPONSOR" | "ADMIN"

type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  role: Role
  verified: boolean
  createdAt: string
}

export default function UsersManager() {
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", phone: "", role: "VOLUNTEER" as Role, password: "" })
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'firstName' | 'email'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'ALL') params.set('role', roleFilter)
      if (searchQuery) params.set('q', searchQuery)
      params.set('page', String(page))
      params.set('limit', String(limit))
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/auth/login'
          return
        }
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [roleFilter, page, sortBy, sortOrder])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const filteredUsers = useMemo(() => users, [users])

  async function createUser() {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ email: "", firstName: "", lastName: "", phone: "", role: "VOLUNTEER", password: "" })
      await load()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={(value: Role | "ALL") => setRoleFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="VOLUNTEER">Volunteers</SelectItem>
                <SelectItem value="SPONSOR">Sponsors</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="firstName">First name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
              <SelectTrigger className="w-28"><SelectValue placeholder="Order" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        </div>

        <div className="border rounded-lg mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredUsers.map(user => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.role === "ADMIN" ? "default" : user.role === "SPONSOR" ? "secondary" : "outline"}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant={user.verified ? "default" : "destructive"} className="text-xs">
                      {user.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No users found
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">Add New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={form.firstName}
              onChange={e => setForm({...form, firstName: e.target.value})}
            />
            <Input
              placeholder="Last Name"
              value={form.lastName}
              onChange={e => setForm({...form, lastName: e.target.value})}
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
            />
            <Select value={form.role} onValueChange={value => setForm({...form, role: value as Role})}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                <SelectItem value="SPONSOR">Sponsor</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
            />
          </div>
          <Button className="mt-4" onClick={createUser}>Create User</Button>
        </div>
      </CardContent>
    </Card>
  )
}
