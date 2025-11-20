"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AppSidebar } from "./app-sidebar"
import { MobileBottomNav } from "./mobile-bottom-nav"
import { GuestHeader } from "./guest-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"

interface AdaptiveLayoutProps {
  children: React.ReactNode
}

export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleChecked, setRoleChecked] = useState(false)

  // Check if current page should not show sidebar
  const isFullScreenPage = pathname === '/access-denied' || pathname === '/auth' || pathname === '/role-access'

  // Check user role when user is available
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user || roleChecked) return

      try {
        const { data: userData, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user role:', error)
          setUserRole('buyer') // Default to buyer if error
        } else {
          setUserRole(userData?.role || 'buyer')
        }
      } catch (error) {
        console.error('Unexpected error checking user role:', error)
        setUserRole('buyer') // Default to buyer if error
      } finally {
        setRoleChecked(true)
      }
    }

    checkUserRole()
  }, [user, roleChecked])

  // Check if user has permission to see navigation (client or buyer roles only)
  const canShowNavigation = userRole && (userRole === 'client' || userRole === 'buyer')

  // Mostrar un loading state mientras se determina el estado de autenticación y el rol
  if (loading || (user && !roleChecked)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-lime-400 rounded-lg animate-pulse" />
      </div>
    )
  }

  // Layout para usuarios NO registrados
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <GuestHeader />
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  // Layout para páginas de pantalla completa (sin sidebar)
  if (isFullScreenPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    )
  }

  // Layout para usuarios registrados
  if (canShowNavigation) {
    // Layout con navegación completa para usuarios con roles client/buyer
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-screen bg-background text-foreground">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
          <MobileBottomNav />
        </div>
      </SidebarProvider>
    )
  } else {
    // Layout sin navegación para usuarios con otros roles
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="flex-1">{children}</main>
      </div>
    )
  }
}
