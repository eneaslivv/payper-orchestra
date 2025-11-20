"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Home, Ticket, Calendar, User, LifeBuoy, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "./ui/button"
import { useAuth } from "@/contexts/auth-context"
import { UserRoleBadge } from "./user-role-badge"

// Define menu items with specific role restrictions
const allMenuItems = [
  // {
  //   title: "Home",
  //   url: "/",
  //   icon: Home,
  //   roles: ["client", "buyer"],
  // },
  {
    title: "All Events",
    url: "/events",
    icon: Calendar,
    roles: ["client", "buyer"], // Both client and buyer can view events
  },
  {
    title: "My Tickets",
    url: "/tickets",
    icon: Ticket,
    roles: ["client", "buyer"], // Only buyers can view their purchased tickets
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    roles: ["client", "buyer"], // Both can access profile settings
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { signOut, userFullName, userRole } = useAuth()

  // Filter menu items based on user role - show items based on specific role permissions
  const menuItems = allMenuItems.filter(item =>
    !userRole || item.roles.includes(userRole)
  )

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-lime-400 rounded-lg" />
            <h1 className="text-xl font-bold">EventTickets</h1>
          </div>
          {userFullName && (
            <div className="text-sm text-muted-foreground">
              Hello, <span className="font-medium text-foreground">{userFullName}</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton isActive={pathname === item.url} tooltip={item.title}>
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[state=collapsed]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-2">
          <UserRoleBadge showIcon={true} className="justify-center" />
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <LifeBuoy className="h-5 w-5" />
            <span>Help</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
