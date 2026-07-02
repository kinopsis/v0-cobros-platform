'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ComboboxBuscable } from '@/components/ui/combobox-buscable'
import { UsuarioDialog } from '@/components/usuarios/usuario-dialog'
import { ImportDialog } from '@/components/usuarios/import-dialog'
import { Eye, Trash2, Edit, Plus, MoreHorizontal, Search, CheckCircle2, XCircle, Loader2, Download, Upload, Filter, MapPin, Briefcase, Users, Shield } from 'lucide-react'
import { toast } from 'sonner'

const roleColors: Record<string, string> = {
  JUZGADO: 'bg-blue-100 text-blue-800',
  GESTOR: 'bg-purple-100 text-purple-800',
  ABOGADO: 'bg-green-100 text-green-800',
  ADMIN: 'bg-red-100 text-red-800',
}

export default function UsuariosPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [rolFilter, setRolFilter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [ciudadFilter, setCiudadFilter] = useState('')
  const [especialidadAreaFilter, setEspecialidadAreaFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Opciones para combobox derivadas de stats
  const ciudadOptions = useMemo(() => {
    return (stats?.usuarios?.topCiudades || []).map((c: any) => ({
      value: c.ciudad,
      label: `${c.ciudad} (${c.total})`,
    }))
  }, [stats])

  const especialidadOptions = useMemo(() => {
    return (stats?.usuarios?.topEspecialidades || []).map((e: any) => ({
      value: e.especialidad,
      label: `${e.especialidad} (${e.total})`,
    }))
  }, [stats])

  const filtrosActivos = [searchTerm, rolFilter, estadoFilter, ciudadFilter, especialidadAreaFilter]
    .filter(Boolean).length

  const handleClearFilters = () => {
    setSearchTerm('')
    setRolFilter('')
    setEstadoFilter('')
    setCiudadFilter('')
    setEspecialidadAreaFilter('')
    setPage(1)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (searchTerm) params.set('search', searchTerm)
      if (rolFilter) params.set('rol', rolFilter)
      if (estadoFilter) params.set('activo', estadoFilter)
      if (ciudadFilter) params.set('ciudad', ciudadFilter)
      if (especialidadAreaFilter) params.set('especialidad_area', especialidadAreaFilter)

      const res = await fetch(`/api/usuarios?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
        setTotal(data.total)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, rolFilter, estadoFilter, ciudadFilter, especialidadAreaFilter])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [fetchUsers, fetchStats])

  const handleToggleActivo = async (userId: string, activo: boolean) => {
    try {
      const res = await fetch(`/api/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      })
      if (res.ok) {
        toast.success(activo ? 'Usuario desactivado' : 'Usuario activado')
        fetchUsers()
      }
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleBulkAction = async (accion: 'activar' | 'desactivar') => {
    if (selectedIds.length === 0) {
      toast.error('Seleccione al menos un usuario')
      return
    }
    setBulkLoading(true)
    try {
      const res = await fetch('/api/usuarios/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, accion }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message)
        setSelectedIds([])
        fetchUsers()
      }
    } catch (error) {
      toast.error('Error en operacion masiva')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleEdit = (user: any) => {
    setEditUser(user)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditUser(null)
    setDialogOpen(true)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(users.map((u: any) => u.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.set('export', 'csv')
      if (searchTerm) params.set('search', searchTerm)
      if (rolFilter) params.set('rol', rolFilter)
      if (estadoFilter) params.set('activo', estadoFilter)
      if (ciudadFilter) params.set('ciudad', ciudadFilter)
      if (especialidadAreaFilter) params.set('especialidad_area', especialidadAreaFilter)

      const res = await fetch(`/api/usuarios?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'usuarios.csv'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exportación descargada correctamente')
    } catch (error) {
      toast.error('Error al exportar')
    }
  }

  const handleSearchChange = (value: string, setter: (v: string) => void) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setter(value)
    debounceRef.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios del sistema y sus permisos
        </p>
      </div>

      {/* Search, Filters and Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {filtrosActivos > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filtrosActivos} activo{filtrosActivos > 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            {filtrosActivos > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Fila 1: Search + Rol + Estado */}
          <div className="flex flex-1 gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o juzgado..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value, setSearchTerm)}
                className="pl-10"
              />
            </div>
            <Select value={rolFilter} onValueChange={(v) => { setRolFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="JUZGADO">Juzgado</SelectItem>
                <SelectItem value="GESTOR">Gestor</SelectItem>
                <SelectItem value="ABOGADO">Abogado</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[130px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <ComboboxBuscable
              options={ciudadOptions}
              value={ciudadFilter}
              onChange={(v) => { setCiudadFilter(v); setPage(1) }}
              placeholder="Ciudad/Municipio..."
              searchPlaceholder="Buscar ciudad..."
              className="min-w-[160px]"
            />
            <ComboboxBuscable
              options={especialidadOptions}
              value={especialidadAreaFilter}
              onChange={(v) => { setEspecialidadAreaFilter(v); setPage(1) }}
              placeholder="Especialidad/Área..."
              searchPlaceholder="Buscar especialidad..."
              className="min-w-[180px]"
            />
          </div>
          {/* Fila 2: Botones de accion */}
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('activar')} disabled={bulkLoading}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Activar ({selectedIds.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction('desactivar')} disabled={bulkLoading}>
                    <XCircle className="mr-1 h-4 w-4" /> Desactivar ({selectedIds.length})
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Total de usuarios: {total} | Pagina {page} de {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selectedIds.length === users.length && users.length > 0} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Organizacion</TableHead>
                    <TableHead>O365</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.includes(user.id)} onCheckedChange={() => toggleSelect(user.id)} />
                      </TableCell>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.rol] || 'bg-gray-100'}>
                          {user.rol}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.ciudad || user.distrito || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.especialidad_area || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.nombre_juzgado || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        {user.azure_oid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/usuarios/${user.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActivo(user.id, user.activo)}
                              className={user.activo ? 'text-destructive' : 'text-green-600'}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {user.activo ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Usuarios */}
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats?.usuarios?.total || total}</div>
            <p className="text-xs text-blue-600/70 mt-1">
              {stats?.usuarios?.activos || 0} activos
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Por Rol */}
        <Card className="bg-purple-50/50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              Por Rol
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <RolBar label="Juzgados" count={stats?.usuarios?.porRol?.JUZGADO || 0} total={stats?.usuarios?.total || 1} color="bg-blue-500" />
              <RolBar label="Gestores" count={stats?.usuarios?.porRol?.GESTOR || 0} total={stats?.usuarios?.total || 1} color="bg-purple-500" />
              <RolBar label="Abogados" count={stats?.usuarios?.porRol?.ABOGADO || 0} total={stats?.usuarios?.total || 1} color="bg-green-500" />
              <RolBar label="Admin" count={stats?.usuarios?.porRol?.ADMIN || 0} total={stats?.usuarios?.total || 1} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Office 365 */}
        <Card className="bg-green-50/50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Office 365
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats?.usuarios?.o365Vinculados || 0}</div>
            <p className="text-xs text-green-600/70 mt-1">
              Usuarios vinculados
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Por Ciudad */}
        <Card className="bg-amber-50/50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-600" />
              Por Ciudad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-900 mb-1">
              {stats?.usuarios?.ciudades || 0}
            </div>
            <div className="space-y-0.5">
              {(stats?.usuarios?.topCiudades || []).slice(0, 5).map((c: any) => (
                <div key={c.ciudad} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2 max-w-[60px] sm:max-w-[80px] md:max-w-[120px]">{c.ciudad}</span>
                  <span className="font-medium tabular-nums">{c.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Por Especialidad */}
        <Card className="bg-cyan-50/50 border-cyan-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-cyan-600" />
              Por Especialidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-cyan-900 mb-1">
              {stats?.usuarios?.especialidades || 0}
            </div>
            <div className="space-y-0.5">
              {(stats?.usuarios?.topEspecialidades || []).slice(0, 5).map((e: any) => (
                <div key={e.especialidad} className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate mr-2 max-w-[130px]">{e.especialidad}</span>
                  <span className="font-medium tabular-nums">{e.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Solicitudes */}
        <Card className="bg-rose-50/50 border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-rose-600" />
              Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900">{stats?.solicitudes?.activas || 0}</div>
            <p className="text-xs text-rose-600/70 mt-1">
              Activas de {stats?.solicitudes?.total || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      <UsuarioDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        usuario={editUser}
        onSuccess={fetchUsers}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchUsers}
      />
    </div>
  )
}

function RolBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / (total || 1)) * 100) || 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-muted-foreground text-xs">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-7 text-right text-xs font-medium tabular-nums">{count}</span>
    </div>
  )
}
