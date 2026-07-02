/**
 * Script para insertar los 11 abogados respondientes en Supabase.
 *
 * Uso: npx tsx scripts/seed-abogados.ts
 *
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: resolve(__dirname, "..", ".env.local") })

const ABOGADOS = [
  {
    email: "adriana.ladino@cendoj.ramajudicial.gov.co",
    nombre: "ADRIANA LADINO GIRALDO",
    especialidades: ["DESACATO", "COSTAS"],
  },
  {
    email: "angela.garcia@cendoj.ramajudicial.gov.co",
    nombre: "ANGELA MARIA GARCIA ROMAN",
    especialidades: ["DESACATO", "REINTEGRO"],
  },
  {
    email: "beatriz.garcia@cendoj.ramajudicial.gov.co",
    nombre: "BEATRIZ ELENA GARCIA GUZMAN",
    especialidades: ["NO_PENAL", "COSTAS"],
  },
  {
    email: "diana.otalvaro@cendoj.ramajudicial.gov.co",
    nombre: "DIANA PATRICIA OTALVARO CARDONA",
    especialidades: ["DESACATO_FIDUPREVISORA", "DESACATO"],
  },
  {
    email: "doris.loaiza@cendoj.ramajudicial.gov.co",
    nombre: "DORIS MILENA LOAIZA BAENA",
    especialidades: ["COSTAS", "REINTEGRO"],
  },
  {
    email: "erika.franco@cendoj.ramajudicial.gov.co",
    nombre: "ERIKA ALEJANDRA FRANCO ESPINOSA",
    especialidades: ["DESACATO", "NO_PENAL"],
  },
  {
    email: "juan.arango@cendoj.ramajudicial.gov.co",
    nombre: "JUAN PABLO ARANGO OROZCO",
    especialidades: ["COSTAS", "DESACATO_FIDUPREVISORA"],
  },
  {
    email: "lesly.mosquera@cendoj.ramajudicial.gov.co",
    nombre: "LESLY MAGOLA MOSQUERA CARDENAS",
    especialidades: ["REINTEGRO", "NO_PENAL"],
  },
  {
    email: "milton.cardenas@cendoj.ramajudicial.gov.co",
    nombre: "MILTON CARDENAS GALLO",
    especialidades: ["DESACATO", "COSTAS", "NO_PENAL"],
  },
  {
    email: "ricardo.arias@cendoj.ramajudicial.gov.co",
    nombre: "RICARDO ALBERTO ARIAS SOTO",
    especialidades: ["DESACATO_FIDUPREVISORA", "REINTEGRO"],
  },
  {
    email: "sabiny.ossa@cendoj.ramajudicial.gov.co",
    nombre: "SABINY ANDREA OSSA LOAIZA",
    especialidades: ["DESACATO", "COSTAS", "DESACATO_FIDUPREVISORA"],
  },
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log("Conectado a Supabase:", supabaseUrl)
  console.log(`Insertando ${ABOGADOS.length} abogados respondientes...\n`)

  let inserted = 0
  let errors = 0

  for (const abogado of ABOGADOS) {
    const { data, error } = await supabase
      .from("usuarios")
      .upsert(
        {
          email: abogado.email,
          nombre: abogado.nombre,
          rol: "ABOGADO",
          activo: true,
          especialidades: abogado.especialidades,
          capacidad_maxima: 20,
          disponibilidad: "DISPONIBLE",
          casos_activos: 0,
        },
        {
          onConflict: "email",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (error) {
      console.error(`  ERROR: ${abogado.nombre} - ${error.message}`)
      errors++
    } else {
      console.log(`  OK: ${abogado.nombre} (${data?.id})`)
      inserted++
    }
  }

  console.log(`\n=== RESUMEN ===`)
  console.log(`Insertados: ${inserted}`)
  console.log(`Errores: ${errors}`)
}

main().catch(console.error)
