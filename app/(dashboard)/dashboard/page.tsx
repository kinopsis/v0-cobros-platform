"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardJuzgado } from "@/components/dashboards/dashboard-juzgado"
import { DashboardGestor } from "@/components/dashboards/dashboard-gestor"
import { DashboardAbogado } from "@/components/dashboards/dashboard-abogado"
import { DashboardAdmin } from "@/components/dashboards/dashboard-admin"

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  switch (user.rol) {
    case "JUZGADO":
      return <DashboardJuzgado />
    case "GESTOR":
      return <DashboardGestor />
    case "ABOGADO":
      return <DashboardAbogado />
    case "ADMIN":
      return <DashboardAdmin />
    default:
      return <DashboardGestor />
  }
}
