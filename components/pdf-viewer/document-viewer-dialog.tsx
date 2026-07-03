"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText, AlertCircle, Loader2 } from "lucide-react"

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
    storage_path?: string  // Para refrescar URL firmada
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
  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)

  // Refrescar URL firmada al abrir el diálogo (si tiene storage_path)
  useEffect(() => {
    if (open && doc?.storage_path) {
      setLoadingUrl(true)
      setRefreshedUrl(null)
      fetch(`/api/documentos/signed-url?path=${encodeURIComponent(doc.storage_path)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.signedUrl) {
            setRefreshedUrl(data.signedUrl)
          } else {
            setRefreshedUrl(doc.url) // fallback a URL original
          }
        })
        .catch(() => setRefreshedUrl(doc.url))
        .finally(() => setLoadingUrl(false))
    } else if (!open) {
      setRefreshedUrl(null)
      setLoadingUrl(false)
    }
  }, [open, doc])

  const pdf = doc ? isPdf(doc) : false
  const displayUrl = refreshedUrl || doc?.url || ""
  const showLoading = loadingUrl && !!doc?.storage_path

  const handleDownload = () => {
    if (!doc) return
    const a = document.createElement("a")
    a.href = displayUrl
    a.download = doc.nombre
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open && !!doc} onOpenChange={onOpenChange}>
      {!doc ? null : (
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <DialogTitle className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 shrink-0 text-destructive" />
            <span className="truncate">{doc.nombre}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Visor de documento {doc.nombre}</DialogDescription>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="shrink-0" disabled={showLoading}>
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          {pdf ? (
            showLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PdfViewer fileUrl={displayUrl} fileName={doc.nombre} />
            )
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
      )}
    </Dialog>
  )
}

export default DocumentViewerDialog
