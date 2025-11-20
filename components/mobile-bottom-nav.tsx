"use client"

import { Home, Ticket, Calendar, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"

// Define menu items with specific role restrictions
const allMenuItems = [
  // {
  //   title: "Home",
  //   url: "/",
  //   icon: Home,
  //   roles: ["client", "buyer"],
  // },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
    roles: ["client", "buyer"], // Both client and buyer can view events
  },
  {
    title: "Tickets",
    url: "/tickets",
    icon: Ticket,
    roles: ["clent", "buyer"], // Only buyers can view their purchased tickets
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    roles: ["client", "buyer"], // Both can access profile settings
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { userRole } = useAuth()

  // Filter menu items based on user role - show items based on specific role permissions
  const menuItems = allMenuItems.filter(item =>
    !userRole || item.roles.includes(userRole)
  )

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/90 backdrop-blur-sm border-t border-zinc-800 z-50">
      <div className="flex justify-around items-center h-full">
        {menuItems.map((item) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full text-xs transition-colors",
                isActive ? "text-lime-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-6 w-6" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
