'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'

const kpis = [
  {
    title: 'Total de Casos',
    value: '547',
    change: '+12%',
    icon: FileText,
    color: 'bg-blue-500/10 text-blue-600'
  },
  {
    title: 'Casos Radicados',
    value: '156',
    change: '+8%',
    icon: Clock,
    color: 'bg-yellow-500/10 text-yellow-600'
  },
  {
    title: 'En Gestión',
    value: '234',
    change: '+15%',
    icon: AlertCircle,
    color: 'bg-orange-500/10 text-orange-600'
  },
  {
    title: 'Resueltos',
    value: '157',
    change: '+22%',
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-600'
  },
  {
    title: 'Recaudación Total',
    value: '$330.7M',
    change: '+18%',
    icon: TrendingUp,
    color: 'bg-emerald-500/10 text-emerald-600'
  },
  {
    title: 'Gestores Activos',
    value: '28',
    change: '+3%',
    icon: Users,
    color: 'bg-purple-500/10 text-purple-600'
  }
]

const eficiencia = [
  {
    label: 'Tiempo Promedio de Gestión',
    valor: '45 días',
    meta: '40 días',
    porcentaje: 87,
    estado: 'En meta'
  },
  {
    label: 'Tasa de Recaudación',
    valor: '68%',
    meta: '70%',
    porcentaje: 97,
    estado: 'Casi meta'
  },
  {
    label: 'Efectividad de Cobro Coactivo',
    valor: '42%',
    meta: '45%',
    porcentaje: 93,
    estado: 'En meta'
  },
  {
    label: 'Satisfacción de Juzgados',
    valor: '8.5/10',
    meta: '8.0/10',
    porcentaje: 106,
    estado: 'Supera meta'
  }
]

export default function EstadisticasPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Indicadores</h1>
        <p className="text-muted-foreground mt-2">KPIs y métricas clave del sistema de cobro coactivo</p>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-green-600 mt-1">{kpi.change} desde el mes anterior</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Métricas de Eficiencia */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Eficiencia</CardTitle>
          <CardDescription>Seguimiento respecto a metas establecidas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {eficiencia.map((metrica, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{metrica.label}</p>
                    <p className="text-xs text-muted-foreground">Meta: {metrica.meta}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{metrica.valor}</p>
                    <p className={`text-xs ${metrica.estado === 'Supera meta' ? 'text-green-600' : metrica.estado === 'En meta' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {metrica.estado}
                    </p>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(metrica.porcentaje, 100)}%`,
                      backgroundColor: metrica.porcentaje >= 100 ? '#10b981' : metrica.porcentaje >= 95 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <p className="text-muted-foreground">Última actualización</p>
              <p className="font-medium">Hoy a las 3:45 PM</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Período de reporte</p>
              <p className="font-medium">Enero - Junio 2024</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Total de registros procesados</p>
              <p className="font-medium">12,847 movimientos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuición Caseload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Juzgado Administrativo 1</span>
              <span className="font-medium">28%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Juzgado Administrativo 2</span>
              <span className="font-medium">18%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Juzgado Laboral</span>
              <span className="font-medium">22%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Otros Juzgados</span>
              <span className="font-medium">32%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
