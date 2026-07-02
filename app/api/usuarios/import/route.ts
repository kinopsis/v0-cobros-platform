import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"
import { parse } from "csv-parse/sync"

const BATCH_SIZE = 200

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const supabase = createAdminClient()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Se requiere un archivo CSV (multipart/form-data)" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No se encontró el archivo en el campo 'file'" }, { status: 400 })
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json({ error: "El archivo debe tener extensión .csv" }, { status: 400 })
  }

  // Validar tamaño máximo (~10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo no debe superar 10MB" }, { status: 400 })
  }

  // Leer y parsear CSV
  const fileContent = await file.text()
  let records: Record<string, string>[]
  try {
    records = parse(fileContent, {
      columns: true,
      delimiter: ",",
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    })
  } catch {
    return NextResponse.json({ error: "No se pudo parsear el archivo CSV. Verifique el formato." }, { status: 400 })
  }

  if (records.length === 0) {
    return NextResponse.json({ error: "El archivo CSV está vacío" }, { status: 400 })
  }

  // Detectar formato: 7 u 10 columnas
  const headers = Object.keys(records[0])
  const hasNuevasColumnas = headers.includes("Municipio") || headers.includes("ESPECIALIDAD O ÁREA")

  // Parsear registros
  interface UsuarioImport {
    email: string
    nombre: string
    distrito: string
    circuito: string
    nombre_juzgado: string
    telefono: string
    corporacion: string
    ciudad: string
    especialidad_area: string
    rol: string
  }

  const usuarios: UsuarioImport[] = []
  const emailsVistos = new Set<string>()
  const erroresDetalle: { email: string; razon: string }[] = []

  for (const record of records) {
    const email = record["Correo Electrónico"]?.trim().toLowerCase()
    const nombre = record["Nombre Usuario"]?.trim()

    if (!email || !nombre) {
      erroresDetalle.push({
        email: email || "(sin email)",
        razon: "Falta email o nombre",
      })
      continue
    }

    // Evitar duplicados por email dentro del CSV
    if (emailsVistos.has(email)) {
      continue
    }
    emailsVistos.add(email)

    const distrito = record["DISTRITO"]?.trim() || ""
    const circuito = record["CIRCUITO"]?.trim() || ""
    const sede = record["Sede o Sucursal"]?.trim() || ""
    const extension = record["Nueva extensión"]?.trim() || ""
    const corporacion = record["CORPORACIÓN O ÁREA"]?.trim() || ""
    const municipio = record["Municipio"]?.trim() || ""
    const especialidadArea = record["ESPECIALIDAD O ÁREA"]?.trim() || ""

    // Deducir rol: emails del dominio ramajudicial son JUZGADO
    const rol = email.endsWith("@cendoj.ramajudicial.gov.co") ? "JUZGADO" : "JUZGADO"

    usuarios.push({
      email,
      nombre,
      distrito,
      circuito,
      nombre_juzgado: sede || `Juzgado ${distrito} - ${circuito}`,
      telefono: extension || "",
      corporacion: hasNuevasColumnas ? corporacion : "",
      ciudad: hasNuevasColumnas ? municipio : "",
      especialidad_area: hasNuevasColumnas ? especialidadArea : "",
      rol,
    })
  }

  // Batch upsert a Supabase
  let insertados = 0
  let actualizados = 0
  let erroresBatch = 0

  for (let i = 0; i < usuarios.length; i += BATCH_SIZE) {
    const batch = usuarios.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from("usuarios")
      .upsert(batch, {
        onConflict: "email",
        ignoreDuplicates: false,
      })

    if (error) {
      erroresBatch += batch.length
      erroresDetalle.push({
        email: `Lote ${Math.floor(i / BATCH_SIZE) + 1}`,
        razon: error.message,
      })
    } else {
      // No podemos distinguir insert vs update fácilmente con upsert
      insertados += batch.length
    }
  }

  return NextResponse.json({
    total_procesados: usuarios.length,
    insertados,
    actualizados,
    errores: erroresBatch + erroresDetalle.filter((e) => e.razon === "Falta email o nombre").length,
    errores_detalle: erroresDetalle.slice(0, 50), // Limitar a 50 errores
    formato_detectado: hasNuevasColumnas ? "10 columnas (Municipio, Especialidad incluidos)" : "7 columnas (formato básico)",
  })
}
