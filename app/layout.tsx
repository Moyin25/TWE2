import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import ScrollToTop from "@/components/ui/scroll-to-top"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "The Weather and Everything (TW&E) - Environmental Action NGO",
  description:
    "Join TW&E in our mission to combat climate change and protect our environment through community action and awareness.",
  keywords: [
    "environmental action",
    "climate change",
    "sustainability",
    "NGO",
    "community action",
    "climate advocacy",
    "environmental education",
    "TW&E",
    "The Weather and Everything",
    "green initiatives",
    "climate solutions",
    "environmental protection",
    "climate justice"
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ScrollToTop />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
