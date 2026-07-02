/**
 * Script para importar usuarios JUZGADO desde CSV (7 o 10 columnas) a Supabase.
 *
 * Soporta:
 *   - 0017_Tabla principal_new.csv (7 columnas)
 *   - 0017_Tabla principal_10col.csv (10 columnas: +CORPORACIÓN O ÁREA, +Municipio, +ESPECIALIDAD O ÁREA)
 *
 * Uso: npx tsx scripts/seed-usuarios.ts [ruta_csv]
 *
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: resolve(__dirname, "..", ".env.local") })
import { parse } from "csv-parse/sync"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

// Usar argumento de línea de comandos como ruta CSV, o default al de 10 columnas
const csvArg = process.argv[2]
const DEFAULT_CSV = join(__dirname, "..", "0017_Tabla principal_10col.csv")
const FALLBACK_CSV = join(__dirname, "..", "0017_Tabla principal_new.csv")
const CSV_PATH = csvArg || (existsSync(DEFAULT_CSV) ? DEFAULT_CSV : FALLBACK_CSV)
const BATCH_SIZE = 200

interface UsuarioRow {
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

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log("Conectado a Supabase:", supabaseUrl)

  // Leer CSV (el archivo usa encoding Windows-1252/latin1, no UTF-8)
  console.log("Leyendo archivo:", CSV_PATH)
  const fileContent = readFileSync(CSV_PATH, "latin1")

  const records = parse(fileContent, {
    columns: true,
    delimiter: ",",
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true,
  })

  console.log(`Total de registros en CSV: ${records.length}`)

  // Detectar si el CSV tiene las nuevas columnas (10 cols vs 7 cols)
  const firstRecord = records[0] as Record<string, string>
  const hasNuevasColumnas = "Municipio" in firstRecord || "ESPECIALIDAD O ÁREA" in firstRecord
  console.log(`Formato detectado: ${hasNuevasColumnas ? "10 columnas (Municipio, Especialidad incluidos)" : "7 columnas (formato básico)"}`)

  // Parsear cada registro
  const usuarios: UsuarioRow[] = []
  let skipped = 0
  const emailsVistos = new Set<string>()

  for (const rawRecord of records) {
    const record = rawRecord as Record<string, string>
    const email = record["Correo Electrónico"]?.trim().toLowerCase()
    const nombre = record["Nombre Usuario"]?.trim()
    const distrito = record["DISTRITO"]?.trim()
    const circuito = record["CIRCUITO"]?.trim()
    const sede = record["Sede o Sucursal"]?.trim()
    const extension = record["Nueva extensión"]?.trim()
    const corporacion = record["CORPORACIÓN O ÁREA"]?.trim() || ""
    const municipio = record["Municipio"]?.trim() || ""
    const especialidadArea = record["ESPECIALIDAD O ÁREA"]?.trim() || ""

    if (!email || !nombre) {
      skipped++
      continue
    }

    // Evitar duplicados por email
    if (emailsVistos.has(email)) {
      skipped++
      continue
    }
    emailsVistos.add(email)

    usuarios.push({
      email,
      nombre,
      distrito: distrito || "",
      circuito: circuito || "",
      nombre_juzgado: sede || `Juzgado ${distrito} - ${circuito}`,
      telefono: extension || "",
      corporacion: hasNuevasColumnas ? corporacion : "",
      ciudad: hasNuevasColumnas ? municipio : "",
      especialidad_area: hasNuevasColumnas ? especialidadArea : "",
      rol: "JUZGADO",
    })
  }

  console.log(`Registros parseados: ${usuarios.length}, omitidos (sin email o duplicados): ${skipped}`)

  // Insertar en batches
  let inserted = 0
  let errors = 0

  for (let i = 0; i < usuarios.length; i += BATCH_SIZE) {
    const batch = usuarios.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from("usuarios")
      .upsert(batch, {
        onConflict: "email",
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`Error en batch ${i / BATCH_SIZE + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    const progress = Math.round((i / usuarios.length) * 100)
    process.stdout.write(`\rProgreso: ${progress}% (${inserted} insertados, ${errors} errores)`)
  }

  console.log(`\n\n=== RESUMEN ===`)
  console.log(`Total CSV: ${records.length}`)
  console.log(`Parseados: ${usuarios.length}`)
  console.log(`Insertados: ${inserted}`)
  console.log(`Errores: ${errors}`)
  console.log(`Omitidos: ${skipped}`)
}

main().catch(console.error)
