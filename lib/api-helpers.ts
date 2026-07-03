/**
 * Helpers para respuestas de API con enmascaramiento de errores en producción.
 * En desarrollo, los mensajes de error completos son visibles.
 * En producción, se retornan mensajes genéricos para no exponer estructura interna.
 */

import { NextResponse } from "next/server"

const isProd = process.env.NODE_ENV === "production"

export function apiError(
  internalMessage: string,
  publicMessage: string = "Error interno del servidor",
  status: number = 500,
) {
  return NextResponse.json(
    {
      error: isProd ? publicMessage : internalMessage,
      ...(isProd ? {} : { internal: internalMessage }),
    },
    { status },
  )
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status })
}

/**
 * Logger simple para API routes.
 * En producción, reemplazar con pino/winston para logs estructurados.
 */
type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  error?: string
  timestamp: string
}

export function logApi(level: LogLevel, message: string, error?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  }

  if (error instanceof Error) {
    entry.error = error.message
  } else if (error && typeof error === "object") {
    entry.error = JSON.stringify(error)
  }

  if (isProd) {
    // En producción, emitir JSON estructurado para agregadores de logs
    const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
    logFn(JSON.stringify(entry))
  } else {
    // En desarrollo, log más verboso
    const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "ℹ️"
    console.log(`${prefix} [${entry.timestamp}] ${message}`, error || "")
  }
}
