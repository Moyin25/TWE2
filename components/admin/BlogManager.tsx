"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AVAILABLE_CATEGORIES } from '@/lib/categories'
import { Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

type Post = {
  id: string
  title: string
  content: string
  excerpt?: string | null
  image?: string | null
  category: string
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  createdAt: string
  author: { id: string; firstName: string; lastName: string; email: string }
  _count?: { comments: number }
}

export default function BlogManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ title: "", content: "", excerpt: "", image: "", category: "Climate Science", status: "DRAFT" as Post["status"] })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/blogs")
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/auth/login'
          return
        }
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to load blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createPost() {
    setCreating(true)
    setError("")
    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ title: "", content: "", excerpt: "", image: "", category: "Climate Science", status: "DRAFT" })
        await load()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to create post")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setCreating(false)
    }
  }

  async function deletePost(id: string) {
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        await load()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete post")
      }
    } catch (err) {
      setError("Network error occurred")
    }
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Create Blog Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
            <SelectContent>
              {AVAILABLE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <input id="blog-image-file" type="file" accept="image/*" className="hidden" title="Upload blog image" onChange={async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              try {
                const fd = new FormData(); fd.append('file', file)
                const up = await fetch('/api/admin/gallery/upload', { method: 'POST', body: fd })
                const json = await up.json()
                if (up.ok && json.url) setForm(f => ({ ...f, image: json.url }))
              } catch {}
            }} />
            <Button type="button" variant="outline" onClick={() => document.getElementById('blog-image-file')?.click()}>Upload</Button>
          </div>
          <Textarea placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          <Textarea placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="min-h-32" />
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Post["status"] })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={createPost} disabled={loading || creating || !form.title || !form.content}>
            {creating ? "Publishing..." : "Publish"}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p>Loading...</p> : null}
          {posts.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-4 border-b py-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{p.title}</h3>
                  <Badge variant="secondary">{p.category}</Badge>
                  <Badge>{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">by {p.author.firstName} {p.author.lastName} • {new Date(p.createdAt).toDateString()}</p>
                {p.excerpt ? <p className="text-sm mt-1 line-clamp-2">{p.excerpt}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">{p._count?.comments || 0} comments</div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{p.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePost(p.id)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
