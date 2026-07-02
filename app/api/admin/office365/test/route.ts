import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const body = await request.json()
  const { tenantId, clientId, clientSecret } = body

  if (!tenantId || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Faltan credenciales: tenantId, clientId, clientSecret" },
      { status: 400 }
    )
  }

  try {
    // Intentar obtener un token de Azure AD para verificar credenciales
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.json({
        success: false,
        error: errorData.error_description || "Credenciales invalidas",
      })
    }

    const tokenData = await tokenResponse.json()

    // Verificar acceso al tenant
    const orgResponse = await fetch("https://graph.microsoft.com/v1.0/organization", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!orgResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "No se pudo verificar el tenant",
      })
    }

    const orgData = await orgResponse.json()
    const tenantName = orgData.value?.[0]?.displayName || "Tenant verificado"

    return NextResponse.json({
      success: true,
      tenantName,
      message: `Conexion exitosa con ${tenantName}`,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Error de conexion",
    })
  }
}
