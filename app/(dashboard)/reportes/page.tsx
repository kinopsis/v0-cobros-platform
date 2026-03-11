'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Filter } from 'lucide-react'

const reporteData = [
  { mes: 'Enero', recaudado: 45200000, pendiente: 23400000, coactiva: 12300000 },
  { mes: 'Febrero', recaudado: 52100000, pendiente: 21500000, coactiva: 14200000 },
  { mes: 'Marzo', recaudado: 48900000, pendiente: 25600000, coactiva: 13500000 },
  { mes: 'Abril', recaudado: 61200000, pendiente: 19800000, coactiva: 15600000 },
  { mes: 'Mayo', recaudado: 55600000, pendiente: 22100000, coactiva: 14800000 },
  { mes: 'Junio', recaudado: 67800000, pendiente: 18900000, coactiva: 16200000 },
]

const estadosCasos = [
  { name: 'Radicado', value: 156, fill: '#1e3a5f' },
  { name: 'En Gestión', value: 89, fill: '#c49f5c' },
  { name: 'En Coactiva', value: 45, fill: '#2563eb' },
  { name: 'Pagado', value: 234, fill: '#10b981' },
  { name: 'Cancelado', value: 23, fill: '#ef4444' },
]

const topJuzgados = [
  { juzgado: 'Juzgado Administrativo 1', casos: 45, recaudado: 234500000 },
  { juzgado: 'Juzgado Administrativo 2', casos: 38, recaudado: 198300000 },
  { juzgado: 'Juzgado Laboral 1', casos: 32, recaudado: 156800000 },
  { juzgado: 'Juzgado de Garantías', casos: 28, recaudado: 142200000 },
  { juzgado: 'Juzgado Penal 1', casos: 25, recaudado: 125600000 },
]

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('general')
  const [fechaInicio, setFechaInicio] = useState('2024-01-01')
  const [fechaFin, setFechaFin] = useState('2024-06-30')

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Análisis</h1>
        <p className="text-muted-foreground mt-2">Seguimiento detallado de indicadores de gestión y recaudación</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros de Reporte</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Tipo de Reporte</label>
            <Select value={tipoReporte} onValueChange={setTipoReporte}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Reporte General</SelectItem>
                <SelectItem value="recaudacion">Recaudación</SelectItem>
                <SelectItem value="gestores">Gestores</SelectItem>
                <SelectItem value="abogados">Abogados</SelectItem>
                <SelectItem value="juzgados">Juzgados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Fecha Inicio</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium">Fecha Fin</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="mt-2"
            />
          </div>
          <div className="flex gap-2 pt-6">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Recaudación */}
      <Card>
        <CardHeader>
          <CardTitle>Recaudación Mensual</CardTitle>
          <CardDescription>Seguimiento de montos recaudados, pendientes y en coactiva</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reporteData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Legend />
              <Bar dataKey="recaudado" fill="#10b981" name="Recaudado" />
              <Bar dataKey="pendiente" fill="#f59e0b" name="Pendiente" />
              <Bar dataKey="coactiva" fill="#1e3a5f" name="En Coactiva" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Estados de Casos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Estados</CardTitle>
            <CardDescription>Casos por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={estadosCasos}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadosCasos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} casos`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Línea Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Casos</CardTitle>
            <CardDescription>Evolución mensual de nuevos casos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={reporteData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="recaudado" stroke="#1e3a5f" strokeWidth={2} name="Recaudado" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Juzgados */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Juzgados por Recaudación</CardTitle>
          <CardDescription>Juzgados con mayor desempeño en recaudación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topJuzgados.map((juzgado, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-sm">{juzgado.juzgado}</p>
                  <p className="text-xs text-muted-foreground">{juzgado.casos} casos activos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">${(juzgado.recaudado / 1000000).toFixed(1)}M</p>
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(juzgado.recaudado / 234500000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
