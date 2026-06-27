"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bell,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Search,
  UserCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const links = [
  { title: "Overview", href: "/dashboard/volunteer", icon: LayoutDashboard },
  { title: "Campaigns", href: "/dashboard/volunteer/campaigns", icon: Search },
  { title: "My Activities", href: "/dashboard/volunteer/my-activities", icon: CalendarCheck },
  { title: "Hours", href: "/dashboard/volunteer/hours", icon: Clock3 },
  { title: "Impact", href: "/dashboard/volunteer/impact", icon: BarChart3 },
  { title: "Profile", href: "/dashboard/volunteer/profile", icon: UserCircle },
  { title: "Notifications", href: "/dashboard/volunteer/notifications", icon: Bell },
]

export default function VolunteerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      window.location.href = "/auth/login"
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b bg-background/90 px-4 backdrop-blur md:px-6">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open volunteer navigation"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 font-semibold">
              <HeartHandshake className="h-5 w-5 text-primary" />
              <span>Volunteer Dashboard</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-background pt-16 transition-transform",
          isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-16 lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close volunteer navigation"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-3">
              {links.map((link) => {
                const Icon = link.icon
                const active = pathname === link.href

                return (
                  <Button
                    key={link.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className={cn("w-full justify-start", !isSidebarOpen && "lg:justify-center")}
                  >
                    <Link href={link.href}>
                      <Icon className="mr-2 h-4 w-4 shrink-0" />
                      <span className={cn("truncate", !isSidebarOpen && "lg:hidden")}>{link.title}</span>
                    </Link>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
          <div className="pt-2 space-y-2 border-t">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-destructive",
                          !isSidebarOpen && "lg:justify-center"
                        )}
                        onClick={async () => {
                          try {
                            await fetch('/api/auth/logout', { method: 'POST' })
                            window.location.href = '/auth/login'
                          } catch {}
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span className={cn("truncate", !isSidebarOpen && "lg:hidden")}>
                          Sign Out
                        </span>
                      </Button>
                    </div>
        </div>
      </aside>

      {isMobile && isSidebarOpen ? (
        <button
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close volunteer navigation overlay"
        />
      ) : null}

      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "fixed top-20 z-30 hidden transition-all duration-300 lg:inline-flex",
          isSidebarOpen ? "lg:left-64" : "lg:left-16",
        )}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? "Collapse volunteer navigation" : "Expand volunteer navigation"}
      >
        {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      <main className={cn("pt-16 transition-all duration-300", isSidebarOpen ? "lg:pl-64" : "lg:pl-16")}>
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
