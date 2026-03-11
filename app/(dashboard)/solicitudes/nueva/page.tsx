"use client"

import { SolicitudForm } from "@/components/solicitudes/solicitud-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NuevaSolicitudPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/solicitudes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Nueva Solicitud de Cobro Coactivo
            </h1>
            <p className="text-muted-foreground">
              Complete el formulario para radicar una nueva solicitud
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <SolicitudForm mode="create" />
    </div>
  )
}
