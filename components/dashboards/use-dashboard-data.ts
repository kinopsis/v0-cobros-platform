"use client"

import { useState, useEffect } from "react"

export interface DashboardBIData {
  montoPorJuzgado: any[]
  sancionadosPorJuzgado: any[]
  radicacionesPorJuzgado: any[]
  distribucionConcepto: any[]
  distribucionNaturaleza: any[]
  tiempoPromedioAsignacion: any
  eficienciaPorRol: any
  kpi: {
    montoTotalPendiente: number
    totalSancionados: number
    totalRadicaciones: number
    totalActivas: number
    totalCerradas: number
    valorTotalSancionesCOP: number
    valorSancionesPendienteCOP: number
    valorSancionesCerradoCOP: number
    tiempoPromedioCierre: number
    tasaRecaudo: number
  }
  solicitudesPorEstado: Record<string, number>
  sancionadosPorEstado: Record<string, number>
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardBIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/bi")
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`)
        return r.json()
      })
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
