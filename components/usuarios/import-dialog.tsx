"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle, XCircle } from "lucide-react"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type ImportStatus = "idle" | "uploading" | "success" | "error"

interface ImportResult {
  total_procesados: number
  insertados: number
  actualizados: number
  errores: number
  errores_detalle?: { email: string; razon: string }[]
  formato_detectado?: string
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<ImportStatus>("idle")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Solo se aceptan archivos .csv")
        return
      }
      setFile(selectedFile)
      setStatus("idle")
      setResult(null)
      setErrorMsg("")
    }
  }

  const handleImport = async () => {
    if (!file) return

    setStatus("uploading")
    setErrorMsg("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/usuarios/import", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setErrorMsg(data.error || "Error al importar")
        return
      }

      setResult(data)
      setStatus("success")
      toast.success(`Importación completada: ${data.insertados} usuarios procesados`)
    } catch (error) {
      setStatus("error")
      setErrorMsg("Error de conexión al importar. Intente de nuevo.")
    }
  }

  const handleClose = () => {
    if (status === "success") {
      onSuccess()
    }
    setFile(null)
    setStatus("idle")
    setResult(null)
    setErrorMsg("")
    onOpenChange(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Usuarios desde CSV</DialogTitle>
          <DialogDescription>
            Selecciona un archivo CSV con los datos de los usuarios a importar.
            Se actualizarán los usuarios existentes por email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de upload */}
          {status === "idle" && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Seleccionar archivo CSV"
                title="Seleccionar archivo CSV"
              />
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-10 w-10 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="font-medium">Arrastra o selecciona un archivo CSV</p>
                  <p className="text-sm text-muted-foreground">
                    Formato esperado: columnas DISTRITO, CIRCUITO, Nombre Usuario, Correo Electrónico, etc.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estado: subiendo */}
          {status === "uploading" && (
            <div className="flex flex-col items-center py-8 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Procesando archivo...</p>
              <p className="text-sm text-muted-foreground">{file?.name}</p>
            </div>
          )}

          {/* Estado: éxito */}
          {status === "success" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" />
                <span className="font-medium text-lg">Importación completada</span>
              </div>

              {result.formato_detectado && (
                <p className="text-sm text-muted-foreground">
                  Formato detectado: {result.formato_detectado}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{result.total_procesados}</p>
                  <p className="text-xs text-muted-foreground">Total procesados</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.insertados}</p>
                  <p className="text-xs text-green-600">Insertados/Actualizados</p>
                </div>
              </div>

              {result.errores > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">{result.errores} errores</span>
                  </div>
                  {result.errores_detalle && result.errores_detalle.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {result.errores_detalle.map((err, i) => (
                        <p key={i} className="text-xs text-red-600">
                          <strong>{err.email}</strong>: {err.razon}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Estado: error */}
          {status === "error" && (
            <div className="flex flex-col items-center py-6 space-y-3">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="font-medium text-destructive">Error en la importación</p>
              <p className="text-sm text-muted-foreground text-center">{errorMsg}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {status === "success" ? "Cerrar" : "Cancelar"}
          </Button>
          {status === "idle" && file && (
            <Button onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          )}
          {status === "error" && (
            <Button onClick={() => { setStatus("idle"); setErrorMsg("") }}>
              Intentar de nuevo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
