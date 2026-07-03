"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Search, Plus, Download, Upload, MoreHorizontal, Edit, Trash2, Loader2, Building2, Filter, XCircle } from "lucide-react"

interface Juzgado { codigo: string; nombre: string }

export default function JuzgadosPage() {
  const [juzgados, setJuzgados] = useState<Juzgado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editJuzgado, setEditJuzgado] = useState<Juzgado | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)

  const filtrosActivos = searchTerm ? 1 : 0

  const fetchJuzgados = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(); params.set("page", String(page)); params.set("limit", "50")
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/juzgados?${params}`)
      if (res.ok) { const data = await res.json(); setJuzgados(data.data || []); setTotal(data.total); setTotalPages(data.totalPages) }
    } catch { toast.error("Error al cargar juzgados") } finally { setLoading(false) }
  }, [page, searchTerm])

  useEffect(() => { fetchJuzgados() }, [fetchJuzgados])

  const handleClearFilters = () => { setSearchTerm(""); setPage(1) }
  const handleCreate = () => { setEditJuzgado(null); setFormOpen(true) }
  const handleEdit = (juzgado: Juzgado) => { setEditJuzgado(juzgado); setFormOpen(true) }

  const handleDelete = async (codigo: string) => {
    if (!confirm(`Eliminar juzgado "${codigo}"?`)) return
    try {
      const res = await fetch(`/api/admin/juzgados?codigo=${encodeURIComponent(codigo)}`, { method: "DELETE" })
      if (res.ok) { toast.success("Juzgado eliminado"); fetchJuzgados() }
      else { const err = await res.json(); toast.error(err.error) }
    } catch { toast.error("Error de conexion") }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true)
    const form = new FormData(e.currentTarget)
    const codigo = form.get("codigo") as string; const nombre = form.get("nombre") as string
    if (!codigo || !nombre) { toast.error("Requerido"); setSaving(false); return }
    try {
      const res = await fetch("/api/admin/juzgados", { method: editJuzgado ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo, nombre }) })
      if (res.ok) { toast.success(editJuzgado ? "Actualizado" : "Creado"); setFormOpen(false); fetchJuzgados() }
      else { const err = await res.json(); toast.error(err.error) }
    } catch { toast.error("Error") } finally { setSaving(false) }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(); params.set("export", "csv")
      if (searchTerm) params.set("search", searchTerm)
      const res = await fetch(`/api/admin/juzgados?${params}`)
      const blob = await res.blob(); const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = "juzgados.csv"; a.click(); URL.revokeObjectURL(url)
      toast.success("Exportado")
    } catch { toast.error("Error") }
  }

  const handleImport = async () => {
    if (!importFile) return; setImporting(true)
    try {
      const fd = new FormData(); fd.append("file", importFile)
      const res = await fetch("/api/admin/juzgados/import", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok) { toast.success(`Importado: ${data.insertados}`); setImportOpen(false); setImportFile(null); fetchJuzgados() }
      else toast.error(data.error)
    } catch { toast.error("Error") } finally { setImporting(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2"><h1 className="text-3xl font-bold">Gestion de Juzgados</h1><p className="text-muted-foreground">Administra codigos y nombres de despachos judiciales</p></div>
      <Card>
        <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-medium flex items-center gap-2"><Filter className="h-4 w-4" />Filtros{filtrosActivos > 0 && <Badge variant="secondary" className="ml-1 text-xs">{filtrosActivos} activo</Badge>}</CardTitle>{filtrosActivos > 0 && <Button variant="ghost" size="sm" onClick={handleClearFilters}><XCircle className="mr-1 h-3.5 w-3.5" />Limpiar</Button>}</div></CardHeader>
        <CardContent><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por codigo o nombre..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }} className="pl-10" /></div><div className="flex gap-2 flex-col sm:flex-row"><Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar</Button><Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Importar</Button><Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />Nuevo</Button></div></div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Juzgados</CardTitle><CardDescription>Total: {total} | Pag. {page}/{totalPages}</CardDescription></CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> :
            <Table><TableHeader><TableRow><TableHead className="w-[200px]">Codigo</TableHead><TableHead>Nombre</TableHead><TableHead className="w-[80px] text-right"></TableHead></TableRow></TableHeader>
              <TableBody>{juzgados.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center">Sin resultados</TableCell></TableRow> : juzgados.map(j => <TableRow key={j.codigo}><TableCell className="font-mono text-sm">{j.codigo}</TableCell><TableCell className="max-w-[400px] truncate">{j.nombre}</TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleEdit(j)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete(j.codigo)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>)}</TableBody>
            </Table>}
          {totalPages > 1 && <div className="flex items-center justify-between pt-4"><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button><span className="text-sm">Pag. {page}/{totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</Button></div>}
        </CardContent>
      </Card>
      <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{editJuzgado ? "Editar" : "Nuevo"} Juzgado</DialogTitle></DialogHeader><form onSubmit={handleSave} className="space-y-4"><div className="space-y-2"><Label>Codigo *</Label><Input name="codigo" defaultValue={editJuzgado?.codigo || ""} required disabled={!!editJuzgado} /></div><div className="space-y-2"><Label>Nombre *</Label><Input name="nombre" defaultValue={editJuzgado?.nombre || ""} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editJuzgado ? "Guardar" : "Crear"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) setImportFile(null) }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Importar CSV</DialogTitle></DialogHeader><div className="space-y-4"><div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer" onClick={() => document.getElementById("csv-input")?.click()}><input id="csv-input" type="file" accept=".csv" className="hidden" title="CSV" onChange={(e) => { const f = e.target.files?.[0]; if (f?.name.endsWith(".csv")) setImportFile(f); else toast.error("Solo .csv") }} />{importFile ? <div className="space-y-2"><Upload className="h-10 w-10 mx-auto text-primary" /><p className="font-medium">{importFile.name}</p><Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setImportFile(null) }}>Cambiar</Button></div> : <div className="space-y-2"><Upload className="h-10 w-10 mx-auto" /><p>Arrastra un CSV</p><p className="text-sm text-muted-foreground">Columnas: Codigo, Nombre</p></div>}</div></div><DialogFooter><Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null) }}>Cancelar</Button><Button onClick={handleImport} disabled={!importFile || importing}>{importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Importar</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
