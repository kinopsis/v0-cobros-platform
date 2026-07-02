"use client"

import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle } from "lucide-react"

// El visor PDF es client-only (usa APIs del navegador / canvas / worker).
const PdfViewer = dynamic(() => import("./pdf-viewer").then((m) => m.PdfViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Cargando visor...
    </div>
  ),
})

interface DocumentViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    nombre: string
    url: string
    tipo?: string
  } | null
}

function isPdf(doc: { nombre: string; tipo?: string }) {
  return (
    doc.tipo === "application/pdf" ||
    doc.nombre.toLowerCase().endsWith(".pdf")
  )
}

export function DocumentViewerDialog({
  open,
  onOpenChange,
  document: doc,
}: DocumentViewerDialogProps) {
  if (!doc) return null

  const pdf = isPdf(doc)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = doc.url
    a.download = doc.nombre
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <DialogTitle className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 shrink-0 text-destructive" />
            <span className="truncate">{doc.nombre}</span>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="shrink-0">
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          {pdf ? (
            <PdfViewer fileUrl={doc.url} fileName={doc.nombre} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">Vista previa no disponible</p>
              <p className="text-xs text-muted-foreground">
                Este tipo de documento no se puede previsualizar. Descárguelo para abrirlo.
              </p>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentViewerDialog
