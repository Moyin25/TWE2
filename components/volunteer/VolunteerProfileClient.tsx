"use client"

import { FormEvent, useEffect, useState } from "react"
import { Save, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const availabilityOptions = [
  ["weekdays", "Weekdays"],
  ["weekends", "Weekends"],
  ["mornings", "Mornings"],
  ["afternoons", "Afternoons"],
  ["evenings", "Evenings"],
] as const

function listToText(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : ""
}

export default function VolunteerProfileClient() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [form, setForm] = useState({
    bio: "",
    location: "",
    skills: "",
    interests: "",
    availability: {
      weekdays: false,
      weekends: false,
      mornings: false,
      afternoons: false,
      evenings: false,
    },
  })

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      try {
        const response = await fetch("/api/dashboard/volunteer/profile")
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to load profile")
        }

        if (mounted) {
          setUser(result.user)
          setForm({
            bio: result.profile?.bio || "",
            location: result.profile?.location || "",
            skills: listToText(result.profile?.skills),
            interests: listToText(result.profile?.interests),
            availability: {
              weekdays: Boolean(result.profile?.availability?.weekdays),
              weekends: Boolean(result.profile?.availability?.weekends),
              mornings: Boolean(result.profile?.availability?.mornings),
              afternoons: Boolean(result.profile?.availability?.afternoons),
              evenings: Boolean(result.profile?.availability?.evenings),
            },
          })
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load profile")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/dashboard/volunteer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save profile")
      }

      setMessage(result.message || "Profile updated")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Volunteer Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Keep your skills, interests, location, and availability up to date.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{user ? `${user.firstName} ${user.lastName}` : "Volunteer"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium">{user?.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={saveProfile}>
              {message ? <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div> : null}
              {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="City, state, or country" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder="Tell coordinators a little about your volunteer interests" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills</Label>
                  <Input id="skills" value={form.skills} onChange={(event) => setForm((current) => ({ ...current, skills: event.target.value }))} placeholder="Research, logistics, design" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests</Label>
                  <Input id="interests" value={form.interests} onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value }))} placeholder="Cleanups, education, climate action" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Availability</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availabilityOptions.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                      <Checkbox
                        checked={form.availability[key]}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            availability: { ...current.availability, [key]: Boolean(checked) },
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <Button disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
