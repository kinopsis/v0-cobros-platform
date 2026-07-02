/**
 * Script para importar despachos desde Procesos Despachos(Sheet1).csv a Supabase.
 *
 * Uso: npx tsx scripts/seed-despachos.ts
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
import { readFileSync } from "fs"
import { join } from "path"

const CSV_PATH = join(__dirname, "..", "Procesos Despachos(Sheet1).csv")
const BATCH_SIZE = 500

interface DespachoRow {
  radicado_origen: string
  codigo_despacho: string
  nombre_despacho: string
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

  // Leer CSV
  console.log("Leyendo archivo:", CSV_PATH)
  const fileContent = readFileSync(CSV_PATH, "utf-8")

  const records = parse(fileContent, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })

  console.log(`Total de registros en CSV: ${records.length}`)

  // Parsear cada registro
  const despachos: DespachoRow[] = []
  let skipped = 0

  for (const record of records) {
    const radicado = record["No. Radicado Origen"]?.trim()
    const despachoJuzgado = record["Despacho/Juzgado"]?.trim()

    if (!radicado || !despachoJuzgado) {
      skipped++
      continue
    }

    // Separar codigo y nombre: "057894089002 - Juzgado 002 Promiscuo Municipal de Támesis"
    const dashIndex = despachoJuzgado.indexOf(" - ")
    if (dashIndex === -1) {
      skipped++
      continue
    }

    const codigo = despachoJuzgado.substring(0, dashIndex).trim()
    const nombre = despachoJuzgado.substring(dashIndex + 3).trim()

    despachos.push({
      radicado_origen: radicado,
      codigo_despacho: codigo,
      nombre_despacho: nombre,
    })
  }

  console.log(`Registros parseados: ${despachos.length}, omitidos: ${skipped}`)

  // Insertar en batches, deduplicando por radicado_origen
  const uniqueDespachos = new Map<string, DespachoRow>()
  for (const d of despachos) {
    if (!uniqueDespachos.has(d.radicado_origen)) {
      uniqueDespachos.set(d.radicado_origen, d)
    }
  }
  const deduped = Array.from(uniqueDespachos.values())
  console.log(`Despues de deduplicar: ${deduped.length} registros unicos`)

  let inserted = 0
  let errors = 0

  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from("despachos")
      .upsert(batch, {
        onConflict: "radicado_origen",
        ignoreDuplicates: true,
      })

    if (error) {
      console.error(`Error en batch ${i / BATCH_SIZE + 1}:`, error.message)
      errors += batch.length
    } else {
      inserted += batch.length
    }

    const progress = Math.round((i / deduped.length) * 100)
    process.stdout.write(`\rProgreso: ${progress}% (${inserted} insertados, ${errors} errores)`)
  }

  console.log(`\n\n=== RESUMEN ===`)
  console.log(`Total CSV: ${records.length}`)
  console.log(`Parseados: ${despachos.length}`)
  console.log(`Insertados: ${inserted}`)
  console.log(`Errores: ${errors}`)
  console.log(`Omitidos: ${skipped}`)
}

main().catch(console.error)
