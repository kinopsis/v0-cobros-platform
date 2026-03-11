"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { UserRole } from "@/lib/types"
import {
  FileText,
  LayoutDashboard,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  ChevronUp,
  Scale,
  Bell,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

const navigationByRole: Record<UserRole, NavItem[]> = {
  JUZGADO: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Nueva Solicitud", href: "/solicitudes/nueva", icon: FileText },
    { title: "Mis Solicitudes", href: "/solicitudes", icon: FolderOpen },
    { title: "Notificaciones", href: "/notificaciones", icon: Bell, badge: 2 },
  ],
  GESTOR: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Bandeja de Entrada", href: "/gestion", icon: FolderOpen, badge: 3 },
    { title: "Solicitudes", href: "/solicitudes", icon: FileText },
    { title: "Abogados", href: "/abogados", icon: Briefcase },
    { title: "Notificaciones", href: "/notificaciones", icon: Bell, badge: 5 },
  ],
  ABOGADO: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Mis Casos", href: "/casos", icon: Briefcase, badge: 15 },
    { title: "En Proceso", href: "/casos/proceso", icon: Clock },
    { title: "Cerrados", href: "/casos/cerrados", icon: CheckCircle2 },
    { title: "Alertas", href: "/alertas", icon: AlertTriangle, badge: 3 },
    { title: "Notificaciones", href: "/notificaciones", icon: Bell },
  ],
  ADMIN: [
    { title: "Dashboard Ejecutivo", href: "/dashboard", icon: LayoutDashboard },
    { title: "Todas las Solicitudes", href: "/solicitudes", icon: FileText },
    { title: "Gestión", href: "/gestion", icon: FolderOpen },
    { title: "Abogados", href: "/abogados", icon: Briefcase },
    { title: "Reportes", href: "/reportes", icon: BarChart3 },
    { title: "Usuarios", href: "/usuarios", icon: Users },
    { title: "Configuración", href: "/configuracion", icon: Settings },
  ],
}

const roleLabels: Record<UserRole, string> = {
  JUZGADO: "Portal Juzgado",
  GESTOR: "Portal Gestor",
  ABOGADO: "Portal Abogado",
  ADMIN: "Portal Administrador"
}

export function AppSidebar() {
  const { user, logout, switchRole } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const navItems = navigationByRole[user.rol]
  const roleLabel = roleLabels[user.rol]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Scale className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">
              DESAJ Antioquia
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Cobro Coactivo
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            {roleLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-medium text-sidebar-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Demo: Role Switcher */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Demo: Cambiar Rol
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(["JUZGADO", "GESTOR", "ABOGADO", "ADMIN"] as UserRole[]).map((role) => (
                <SidebarMenuItem key={role}>
                  <SidebarMenuButton
                    onClick={() => switchRole(role)}
                    isActive={user.rol === role}
                  >
                    <Users className="h-4 w-4" />
                    <span className="capitalize">{role.toLowerCase()}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getInitials(user.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {user.nombre}
                    </span>
                    <span className="text-xs text-sidebar-foreground/70 truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/perfil">
                    <Users className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
