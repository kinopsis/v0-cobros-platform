'use client'

import { useState } from 'react'
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
import { Eye, Trash2, Edit, Plus, MoreHorizontal, Search } from 'lucide-react'
import { mockUsers } from '@/lib/mock-data'
import { toast } from 'sonner'

export default function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users] = useState(mockUsers)

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.juzgado?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    JUZGADO: 'bg-blue-100 text-blue-800',
    GESTOR: 'bg-purple-100 text-purple-800',
    ABOGADO: 'bg-green-100 text-green-800',
    ADMIN: 'bg-red-100 text-red-800',
  }

  const statusColors: Record<string, string> = {
    ACTIVO: 'bg-success/20 text-success',
    INACTIVO: 'bg-destructive/20 text-destructive',
    SUSPENDIDO: 'bg-warning/20 text-warning',
  }

  const handleDelete = (id: string, nombre: string) => {
    toast.success(`Usuario "${nombre}" marcado para eliminación`)
  }

  const handleEdit = (id: string, nombre: string) => {
    toast.info(`Editar usuario: ${nombre}`)
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

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o juzgado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Total de usuarios: {filteredUsers.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nombre}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.rol]}>
                        {user.rol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.juzgado || 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors['ACTIVO']}>
                        ACTIVO
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      Hace 2 horas
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user.id, user.nombre)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.id, user.nombre)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 desde la semana pasada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Por Rol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Juzgados</span>
                <span className="font-medium">{users.filter(u => u.rol === 'JUZGADO').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gestores</span>
                <span className="font-medium">{users.filter(u => u.rol === 'GESTOR').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abogados</span>
                <span className="font-medium">{users.filter(u => u.rol === 'ABOGADO').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activos Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(users.length * 0.75)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((Math.floor(users.length * 0.75) / users.length) * 100)}% de participación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nuevos esta Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sin cambios respecto a semana anterior
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
