'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

const COLORS = ['#1e3a5f', '#c49f5c', '#2563eb', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#ec4899']

const formatMonto = (monto: number): string => {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`
  if (monto >= 1_000) return `$${(monto / 1_000).toFixed(0)}K`
  return `$${monto.toLocaleString("es-CO")}`
}

export default function ReportesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    fetch("/api/bi")
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  // Hooks must always be called in the same order — before any early return
  const distribucionConcepto = useMemo(() => (data?.distribucionConcepto || []).map((c: any) => ({
    name: (c.clase || '').replace(/_/g, ' '),
    value: c.total,
    monto: c.monto,
    activos: c.activos,
  })), [data?.distribucionConcepto])

  const radicacionesData = useMemo(() => (data?.radicacionesPorJuzgado || []).slice(0, 10).map((r: any) => ({
    juzgado: r.juzgado.length > 25 ? r.juzgado.substring(0, 22) + '...' : r.juzgado,
    Pendientes: r.pendientes,
    "Asignadas a Abogado": r.asignadas_abogado,
  })), [data?.radicacionesPorJuzgado])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const kpi = data?.kpi || {}
  const topJuzgados = (data?.montoPorJuzgado || []).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes y Análisis</h1>
        <p className="text-muted-foreground mt-2">Seguimiento detallado de indicadores de gestión y recaudación</p>
      </div>

      {/* Filtros simplificados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen Ejecutivo</CardTitle>
          <CardDescription>KPIs del sistema de cobro coactivo</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="bg-blue-50 rounded-lg p-3 flex-1 min-w-[120px]">
            <p className="text-xs text-muted-foreground">Monto Pendiente</p>
            <p className="text-xl font-bold text-blue-900">{formatMonto(kpi.montoTotalPendiente || 0)}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 flex-1 min-w-[120px]">
            <p className="text-xs text-muted-foreground">Sancionados</p>
            <p className="text-xl font-bold text-amber-900">{kpi.totalSancionados || 0}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 flex-1 min-w-[120px]">
            <p className="text-xs text-muted-foreground">Radicaciones</p>
            <p className="text-xl font-bold text-indigo-900">{kpi.totalRadicaciones || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 flex-1 min-w-[120px]">
            <p className="text-xs text-muted-foreground">Tasa Recaudo</p>
            <p className="text-xl font-bold text-green-900">{kpi.tasaRecaudo || 0}%</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </CardContent>
      </Card>

      {/* Gráfico de Monto por Juzgado */}
      <Card>
        <CardHeader>
          <CardTitle>Monto Pendiente por Juzgado</CardTitle>
          <CardDescription>Top 10 juzgados con mayor valor pendiente de cobro</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
            <BarChart data={topJuzgados.slice(0, 8).map((j: any) => ({ name: (j.juzgado || '').length > (isMobile ? 14 : 20) ? j.juzgado.substring(0, (isMobile ? 12 : 18)) + '...' : j.juzgado, monto: j.monto_pendiente, casos: j.casos }))} layout="vertical" margin={{ left: isMobile ? 10 : 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => formatMonto(v)} tick={{ fontSize: isMobile ? 9 : 11 }} />
              <YAxis type="category" dataKey="name" width={isMobile ? 110 : 160} tick={{ fontSize: isMobile ? 10 : 11 }} />
              <Tooltip formatter={(value: number) => formatMonto(value)} />
              <Bar dataKey="monto" fill="#c49f5c" name="Monto Pendiente" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Distribución por Naturaleza */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Naturaleza</CardTitle>
            <CardDescription>Volumen de casos por clase de proceso</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
              <BarChart data={distribucionConcepto.slice(0, isMobile ? 6 : 8)} layout="vertical" margin={{ left: isMobile ? 10 : 140, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 9 : 11 }} width={isMobile ? 100 : 130} />
                <Tooltip formatter={(value: number, _name: string, props: any) => [`${value} casos (${props.payload.activos || 0} activos)`, "Total"]} />
                <Bar dataKey="value" name="Casos" radius={[0, 4, 4, 0]}>
                  {distribucionConcepto.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Concepto */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Concepto</CardTitle>
            <CardDescription>Volumen de casos por tipo de asunto</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
              <BarChart data={(data?.distribucionNaturaleza || []).slice(0, isMobile ? 6 : 8).map((a: any) => ({ name: a.asunto.replace(/_/g, ' '), value: a.total, activos: a.activos }))} layout="vertical" margin={{ left: isMobile ? 10 : 140, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: isMobile ? 9 : 11 }} width={isMobile ? 100 : 130} />
                <Tooltip formatter={(value: number, _name: string, props: any) => [`${value} casos (${props.payload.activos || 0} activos)`, "Total"]} />
                <Bar dataKey="value" name="Casos" radius={[0, 4, 4, 0]}>
                  {(data?.distribucionNaturaleza || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Radicaciones por Juzgado */}
      <Card>
        <CardHeader>
          <CardTitle>Radicaciones por Juzgado</CardTitle>
          <CardDescription>Solicitudes totales vs repartidas a abogado por despacho</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={isMobile ? 280 : 320}>
            <BarChart data={radicacionesData} layout="vertical" margin={{ left: isMobile ? 80 : 120, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: isMobile ? 9 : 11 }} />
              <YAxis type="category" dataKey="juzgado" tick={{ fontSize: isMobile ? 9 : 11 }} width={isMobile ? 70 : 110} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Bar dataKey="Pendientes" fill="#f59e0b" />
              <Bar dataKey="Asignadas a Abogado" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Juzgado</CardTitle>
          <CardDescription>Datos completos de monto pendiente, casos y sancionados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Juzgado</TableHead>
                <TableHead className="text-right">Monto Pendiente</TableHead>
                <TableHead className="text-right">Casos</TableHead>
                <TableHead className="text-right">Sancionados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topJuzgados.map((j: any, i: number) => {
                const sanc = (data?.sancionadosPorJuzgado || []).find((s: any) => s.juzgado === j.juzgado)
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{j.juzgado}</TableCell>
                    <TableCell className="text-right text-green-700 font-medium">{formatMonto(j.monto_pendiente)}</TableCell>
                    <TableCell className="text-right">{j.casos}</TableCell>
                    <TableCell className="text-right">{sanc?.total_sancionados || 0}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
