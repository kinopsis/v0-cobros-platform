/**
 * Script para importar códigos de juzgados desde Procesos Despachos(Sheet1 (2)).csv a Supabase.
 *
 * Uso: npx tsx scripts/seed-codigos-despachos.ts
 *
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"
import { parse } from "csv-parse/sync"
import { readFileSync } from "fs"
import { join } from "path"

dotenv.config({ path: resolve(__dirname, "..", ".env.local") })

const CSV_PATH = join(__dirname, "..", "Procesos Despachos(Sheet1 (2)).csv")
const BATCH_SIZE = 500

interface CodigoDespacho {
  codigo: string
  nombre: string
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

  // Leer CSV con codificación latin1 (Windows-1252) para preservar caracteres españoles
  console.log("\nLeyendo archivo:", CSV_PATH)
  const fileBuffer = readFileSync(CSV_PATH)
  // Leer como latin1 y luego convertir a UTF-8 para Postgres
  const fileContent = fileBuffer.toString("latin1")

  const records = parse(fileContent, {
    columns: true,
    delimiter: ",",
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })

  console.log(`Total de registros en CSV: ${records.length}`)

  // Parsear cada registro
  const codigos: CodigoDespacho[] = []
  let skipped = 0

  for (const record of records as Record<string, string>[]) {
    const codigo = record["Codigo"]?.trim()
    const nombre = record["Nombre"]?.trim()

    if (!codigo || !nombre) {
      skipped++
      continue
    }

    codigos.push({ codigo, nombre })
  }

  console.log(`Registros parseados: ${codigos.length}, omitidos: ${skipped}`)

  // Insertar el caso especial "00"
  codigos.push({
    codigo: "00",
    nombre: "ADMINISTRACIÓN JUDICIAL MEDELLÍN (FORMATO LIBRE)",
  })

  // Deduplicar por código (tomar el primero)
  const unique = new Map<string, CodigoDespacho>()
  for (const c of codigos) {
    if (!unique.has(c.codigo)) {
      unique.set(c.codigo, c)
    }
  }
  const deduped = Array.from(unique.values())
  console.log(`Después de deduplicar: ${deduped.length} registros únicos`)

  let inserted = 0
  let errors = 0

  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from("codigos_despachos")
      .upsert(batch, {
        onConflict: "codigo",
        ignoreDuplicates: true,
      })

    if (error) {
      console.error(`Error en batch ${i / BATCH_SIZE + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    const progress = Math.round((Math.min(i + BATCH_SIZE, deduped.length) / deduped.length) * 100)
    process.stdout.write(`\rProgreso: ${progress}% (${inserted} insertados, ${errors} errores)`)
  }

  console.log(`\n\n=== RESUMEN ===`)
  console.log(`Total CSV: ${records.length}`)
  console.log(`Parseados: ${codigos.length}`)
  console.log(`Únicos: ${deduped.length}`)
  console.log(`Insertados: ${inserted}`)
  console.log(`Errores: ${errors}`)
  console.log(`Omitidos: ${skipped}`)
}

main().catch(console.error)
