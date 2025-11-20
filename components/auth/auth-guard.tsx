'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

// Define all protected routes
const PROTECTED_ROUTES = [
  '/profile',
  '/tickets',
  '/cart',
  '/confirmation'
]

// Define routes with specific role requirements
const ROLE_SPECIFIC_ROUTES = {
  '/tickets': ['client', 'buyer'], // Only buyers can access their tickets
  '/profile': ['client', 'buyer'], // Both can access profile
  '/events': ['client', 'buyer'], // Both can view events
  '/cart': ['client', 'buyer'], // Only buyers can access cart
  '/confirmation': ['client', 'buyer'] // Only buyers can see confirmation
}

// Routes that authenticated users can access regardless of role
const PUBLIC_AUTH_ROUTES = [
  '/access-denied',
  '/role-access'
]

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [roleChecked, setRoleChecked] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

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

  useEffect(() => {
    // Don't do anything while loading or role not checked
    if (loading || (user && !roleChecked)) return

    // Check if current route is protected or public auth route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(route => pathname.startsWith(route))

    // If user is not authenticated and trying to access a protected route
    if (!user && isProtectedRoute) {
      console.log('Redirecting to auth - no user on protected route')
      router.push('/auth')
      return
    }

    // If user is authenticated but doesn't have client/buyer role, redirect to role-access page
    if (user && userRole && userRole !== 'client' && userRole !== 'buyer' && !isPublicAuthRoute) {
      console.log('Redirecting to role-access - non-client role not allowed in client app:', userRole)
      router.push('/role-access')
      return
    }

    // Check role-specific route permissions
    if (user && userRole) {
      const currentRoute = Object.keys(ROLE_SPECIFIC_ROUTES).find(route => pathname.startsWith(route))
      if (currentRoute) {
        const allowedRoles = ROLE_SPECIFIC_ROUTES[currentRoute as keyof typeof ROLE_SPECIFIC_ROUTES]
        if (!allowedRoles.includes(userRole)) {
          console.log(`Redirecting to home - ${userRole} role not allowed on ${currentRoute}`)
          router.push('/')
          return
        }
      }
    }

    // If user is authenticated with client/buyer role and trying to access auth pages, redirect to home
    if (user && (userRole === 'client' || userRole === 'buyer') && pathname === '/auth') {
      console.log('Redirecting to home - client user on auth page')
      router.push('/')
      return
    }

  }, [user, loading, pathname, router, roleChecked, userRole])

  // Show loading state while checking authentication or user role
  if (loading || (user && !roleChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if current route is protected and user is not authenticated
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !user) {
    // Show loading while redirect is happening
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Render children for all other cases
  return <>{children}</>
}
