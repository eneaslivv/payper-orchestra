"use client"

import { useAuth } from "@/contexts/auth-context"
import { GuestHome } from "@/components/guest-home"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-lime-400 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Show guest home for non-authenticated users
  if (!isAuthenticated) {
    return <GuestHome />
  }

  // Show authenticated user home
  return (
    <div className="relative h-full flex flex-col items-center justify-center text-center p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-600/50 rounded-full filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/50 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/50 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>
      <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-lime-400 rounded-2xl mb-6" />
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">к𝑜ᵒ𝐋 Ќιᗪz ᴄᴏᴍᴍᴜɴɪᴛʏ</h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8">Restaurante Enero Costanera</p>
      <Link href="/event">
        <Button size="lg" className="bg-lime-400 text-black hover:bg-lime-500 rounded-full text-lg px-8 py-6 group">
          View Event
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  )
}
