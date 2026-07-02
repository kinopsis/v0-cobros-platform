import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Conversión SMMLV → COP ──────────────────────────────────────────────────

// Tabla SMMLV por año (Salario Mínimo Mensual Legal Vigente - Colombia)
const SMMLV_POR_ANIO: Record<number, number> = {
  2026: 1473300,
  2025: 1423500,
  2024: 1300000,
  2023: 1160000,
  2022: 1000000,
  2021: 908526,
  2020: 877803,
}
const SMMLV_DEFAULT = 828116 // 2019 y anteriores

/**
 * Convierte un valor de sanción a pesos colombianos (COP).
 * Si tipoSancion es "PESOS", retorna el valor tal cual.
 * Si tipoSancion es "SMMLV", multiplica por el SMMLV del año de la fecha ejecutoria.
 */
export function convertirSancionACOP(
  cantidadSancion: string | number | null | undefined,
  tipoSancion: string | null | undefined,
  fechaEjecutoria?: string | Date | null
): number {
  if (!cantidadSancion) return 0
  const monto = parseFloat(String(cantidadSancion).replace(/[^0-9.]/g, ""))
  if (isNaN(monto)) return 0

  // Si es en PESOS, ya está en COP
  if (tipoSancion === "PESOS") return monto

  // Si es SMMLV, convertir usando el año de ejecutoria
  if (tipoSancion === "SMMLV") {
    const anio = fechaEjecutoria
      ? new Date(fechaEjecutoria).getFullYear()
      : new Date().getFullYear()
    const smmlv = SMMLV_POR_ANIO[anio] ?? SMMLV_DEFAULT
    return monto * smmlv
  }

  // Sin tipo especificado: asumir PESOS
  return monto
}

/**
 * Formatea un valor en COP para mostrar en UI.
 * Ej: 5000000 → "$ 5.000.000"
 */
export function formatCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor)
}
