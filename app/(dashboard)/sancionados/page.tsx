"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { TIPO_DOCUMENTO_LABELS, TIPO_PERSONA_LABELS } from "@/lib/types"
import { toast } from "sonner"
import { Search, Download, Loader2, User, Filter, XCircle, Eye } from "lucide-react"

interface SancionadoUI {
  id: string; nombreCompleto: string; tipoDocumento: string; numeroDocumento: string
  tipoPersona: string; tipoSancion: string; cantidadSancion: string; solicitudId: string; ciudad: string
}

export default function SancionadosPage() {
  const { user } = useAuth()
  const [sancionados, setSancionados] = useState<SancionadoUI[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const isAdmin = user?.rol === "ADMIN"
  const filtrosActivos = searchTerm ? 1 : 0

  const fetchSancionados = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page)); params.set("limit", "50")
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/sancionados?${params}`)
      if (res.ok) {
        const json = await res.json()
        const mapped = (json.data || []).map((s: any) => ({
          id: s.id, nombreCompleto: s.nombre_completo || "", tipoDocumento: s.tipo_documento || "",
          numeroDocumento: s.numero_documento || "", tipoPersona: s.tipo_persona || "",
          tipoSancion: s.tipo_sancion || "", cantidadSancion: s.cantidad_sancion || "",
          solicitudId: s.solicitud_id || "", ciudad: s.ciudad || ""
        }))
        setSancionados(mapped); setTotal(json.total); setTotalPages(json.totalPages)
      }
    } catch { toast.error("Error al cargar sancionados") }
    finally { setLoading(false) }
  }, [page, searchTerm])

  useEffect(() => { fetchSancionados() }, [fetchSancionados])

  const handleClearFilters = () => { setSearchTerm(""); setPage(1) }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(); params.set("export", "csv")
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/sancionados?${params}`)
      const blob = await res.blob(); const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `sancionados_${new Date().toISOString().split("T")[0]}.csv`; a.click()
      URL.revokeObjectURL(url); toast.success("Exportacion descargada")
    } catch { toast.error("Error al exportar") }
  }

  const formatTipoSancion = (tipo: string, cantidad: string) => {
    if (!tipo && !cantidad) return "-"
    if (tipo === "SMMLV") return `${cantidad} SMMLV`
    if (tipo === "PESOS") return `$${Number(cantidad).toLocaleString("es-CO")}`
    return cantidad || tipo || "-"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2"><h1 className="text-3xl font-bold text-foreground">Personas Sancionadas</h1><p className="text-muted-foreground">Registro centralizado de personas con obligaciones economicas pendientes</p></div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Filter className="h-4 w-4" />Filtros{filtrosActivos > 0 && <Badge variant="secondary" className="ml-1 text-xs">{filtrosActivos} activo{filtrosActivos > 1 ? "s" : ""}</Badge>}</CardTitle>
            {filtrosActivos > 0 && <Button variant="ghost" size="sm" onClick={handleClearFilters}><XCircle className="mr-1 h-3.5 w-3.5" />Limpiar filtros</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nombre o numero de documento..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }} className="pl-10" /></div>
            {isAdmin && <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Listado de Sancionados</CardTitle><CardDescription>Total de registros: {total} | Pagina {page} de {totalPages}</CardDescription></CardHeader>
        <CardContent>
          {loading ? (<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Valor Sancion</TableHead><TableHead>Ciudad</TableHead><TableHead>Solicitud</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {sancionados.length === 0 ? (<TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No se encontraron sancionados.</TableCell></TableRow>) : (
                  sancionados.map((san) => (
                    <TableRow key={san.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{san.nombreCompleto}</TableCell>
                      <TableCell className="text-sm">{TIPO_DOCUMENTO_LABELS[san.tipoDocumento as keyof typeof TIPO_DOCUMENTO_LABELS] || san.tipoDocumento}: {san.numeroDocumento}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{TIPO_PERSONA_LABELS[san.tipoPersona as keyof typeof TIPO_PERSONA_LABELS] || san.tipoPersona}</Badge></TableCell>
                      <TableCell className="text-sm font-mono">{formatTipoSancion(san.tipoSancion, san.cantidadSancion)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{san.ciudad || "-"}</TableCell>
                      <TableCell className="text-sm font-mono"><Link href={`/solicitudes/${san.solicitudId}`} className="hover:underline text-primary">{san.solicitudId}</Link></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/solicitudes/${san.solicitudId}`}><Eye className="mr-2 h-4 w-4" />Ver solicitud</Link></Button></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
              <span className="text-sm text-muted-foreground">Pagina {page} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
