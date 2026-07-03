"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { SolicitudForm } from "@/components/solicitudes/solicitud-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

function NuevaSolicitudContent() {
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")
  const corregir = searchParams.get("corregir") === "1"
  const titulo = corregir ? "Corregir Solicitud Devuelta" : editId ? "Editar Borrador" : "Nueva Solicitud de Cobro Coactivo"
  const subtitulo = corregir
    ? `Corrigiendo solicitud ${editId} — Los cambios se enviarán a validación del gestor`
    : editId ? `Editando solicitud ${editId}` : "Complete el formulario para radicar una nueva solicitud"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/solicitudes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {titulo}
            </h1>
            <p className="text-muted-foreground">
              {subtitulo}
            </p>
          </div>
        </div>
      </div>
      <SolicitudForm mode={editId ? "edit" : "create"} solicitudId={editId || undefined} modoCorreccion={corregir} />
    </div>
  )
}

export default function NuevaSolicitudPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <NuevaSolicitudContent />
    </Suspense>
  )
}
