"use client"

import { useState, useCallback, useRef } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import { Button } from "@/components/ui/button"
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Maximize2,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"

// Configurar el worker de PDF.js via CDN (version exacta de pdfjs-dist)
import { version } from "pdfjs-dist"
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`

interface PdfViewerProps {
  fileUrl: string
  fileName?: string
}

export function PdfViewer({ fileUrl, fileName }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message || "No se pudo cargar el documento")
    setLoading(false)
  }, [])

  const goToPrevPage = () => setPageNumber((p) => Math.max(1, p - 1))
  const goToNextPage = () => setPageNumber((p) => Math.min(numPages, p + 1))
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.25))
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25))
  const rotate = () => setRotation((r) => (r + 90) % 360)
  const fitWidth = () => setScale(1.0)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = fileUrl
    a.download = fileName || "documento.pdf"
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen?.()
    }
  }

  return (
    <div ref={containerRef} className="flex h-full flex-col bg-muted/30">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1} title="Página anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[90px] text-center text-xs text-muted-foreground">
            Página {numPages > 0 ? pageNumber : "—"} de {numPages || "—"}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages} title="Página siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={zoomOut} disabled={scale <= 0.5} title="Alejar">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[48px] text-center text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} disabled={scale >= 3} title="Acercar">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={fitWidth} title="Ajustar ancho">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={rotate} title="Rotar">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFullscreen} title="Pantalla completa">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Descargar">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Documento */}
      <div className="flex-1 overflow-auto">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm font-medium">No se pudo mostrar el documento</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>
        ) : (
          <div className="flex justify-center p-4">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center gap-2 py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Cargando documento...</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                className="mx-auto shadow-md"
                renderTextLayer
                renderAnnotationLayer
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  )
}

export default PdfViewer
