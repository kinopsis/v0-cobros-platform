import { NextResponse } from "next/server"

/**
 * Endpoint de health check para Docker HEALTHCHECK y monitoreo.
 * No requiere autenticación.
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
