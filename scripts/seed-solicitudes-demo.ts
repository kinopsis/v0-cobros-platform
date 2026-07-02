/**
 * Script para insertar 20 solicitudes demo con datos variados
 * para alimentar los dashboards con información real.
 *
 * Uso: npx tsx scripts/seed-solicitudes-demo.ts
 */

import dotenv from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: resolve(__dirname, "..", ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const Juzgados = [
  { nombre: "Juzgado 1 Civil del Circuito de Medellín", codigo: "JAD04-MED-2024", ciudad: "Medellín" },
  { nombre: "Juzgado 2 Penal del Circuito de Medellín", codigo: "JAD08-MED-2024", ciudad: "Medellín" },
  { nombre: "Tribunal Administrativo de Antioquia", codigo: "TAD01-MED-2024", ciudad: "Medellín" },
  { nombre: "Juzgado 3 Laboral del Circuito de Medellín", codigo: "JAD12-MED-2024", ciudad: "Medellín" },
  { nombre: "Juzgado 4 Familia de Medellín", codigo: "JAD15-MED-2024", ciudad: "Medellín" },
  { nombre: "Juzgado Promiscuo Municipal de Bello", codigo: "JPM01-BEL-2024", ciudad: "Bello" },
  { nombre: "Juzgado 1 Civil del Circuito de Envigado", codigo: "JCE01-ENV-2024", ciudad: "Envigado" },
  { nombre: "Juzgado Administrativo de Itagüí", codigo: "JAD02-ITA-2024", ciudad: "Itagüí" },
]

const Estados = [
  "RECIBIDA", "EN_VALIDACION", "RADICADA_EN_SIGOBIUS",
  "ASIGNADA_A_ABOGADO", "EN_PROCESO", "MANDAMIENTO_DE_PAGO",
  "MEDIDAS_CAUTELARES", "CERRADA", "TERMINADA_SIN_PAGO", "DEVUELTA"
]

const Naturalezas = ["ARANCEL", "INCAPACIDADES", "MULTA_CAMARA_COMERCIO", "MULTA_CAUCIONES", "MULTA_COMISARIAS_FAMILIA", "MULTA_CONVERSION_DEPOSITO_JUDICIAL", "MULTA_CORRECCIONAL", "MULTA_INCIDENTE_DESACATO", "MULTA_INCUMPLIMIENTO_CONTRACTUAL", "MULTA_INDEMNIZACION_CAUCIONES", "MULTA_JUECES_PAZ", "MULTA_JURAMENTO_ESTIMATORIO", "MULTA_JURISDICCION_ADMINISTRATIVA", "MULTA_JURISDICCION_CIVIL", "MULTA_JURISDICCION_FAMILIA", "MULTA_JURISDICCION_LABORAL"]

// Conceptos = valores válidos para columna asunto (CHECK constraint)
const Conceptos = ["MULTAS_ADMINISTRATIVAS", "ARANCEL", "MULTAS", "REINTEGRO", "INCAPACIDAD", "POLIZA"]

const SancionadosNombres = [
  { nombre: "Empresa ABC S.A.S.", tipo: "JURIDICA", doc: "900123456-7", tipoDoc: "NIT" },
  { nombre: "Pedro José Rodríguez", tipo: "NATURAL", doc: "1128456789", tipoDoc: "CC" },
  { nombre: "Alcaldía de Medellín", tipo: "JURIDICA", doc: "890905211-1", tipoDoc: "NIT" },
  { nombre: "Constructora XYZ Ltda.", tipo: "JURIDICA", doc: "800567890-3", tipoDoc: "NIT" },
  { nombre: "Laura Patricia González", tipo: "NATURAL", doc: "43876543", tipoDoc: "CC" },
  { nombre: "Fiduprevisora S.A.", tipo: "JURIDICA", doc: "800126785-2", tipoDoc: "NIT" },
  { nombre: "Gobernación de Antioquia", tipo: "JURIDICA", doc: "890980066-1", tipoDoc: "NIT" },
  { nombre: "Hospital San Vicente", tipo: "JURIDICA", doc: "890909659-0", tipoDoc: "NIT" },
  { nombre: "Carlos Andrés Mejía", tipo: "NATURAL", doc: "71654321", tipoDoc: "CC" },
  { nombre: "Transportes Rápidos S.A.", tipo: "JURIDICA", doc: "800998877-5", tipoDoc: "NIT" },
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomMonto(): string {
  const montos = ["5000000", "8500000", "12000000", "25000000", "45000000", "78000000", "150000000", "320000000"]
  return randomFrom(montos)
}

function generateRadicado(): string {
  const anio = "2026"
  const seq = String(randomInt(1, 999)).padStart(3, "0")
  return `050013105${seq}${anio}${String(randomInt(1000, 9999))}`
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  console.log("Conectado a Supabase:", SUPABASE_URL)

  // Obtener IDs de abogados existentes
  const { data: abogados } = await supabase
    .from("usuarios")
    .select("id, nombre")
    .eq("rol", "ABOGADO")
    .eq("activo", true)

  const abogadosIds = (abogados || []).map((a: any) => a.id)
  console.log(`Abogados disponibles: ${abogadosIds.length}`)

  // Obtener IDs de gestores/admin para created_by
  const { data: admins } = await supabase
    .from("usuarios")
    .select("id")
    .eq("rol", "ADMIN")
    .eq("activo", true)
    .limit(1)

  const createdBy = admins?.[0]?.id || null

  let insertados = 0
  let errores = 0

  for (let i = 1; i <= 20; i++) {
    const juzgado = randomFrom(Juzgados)
    const estado = i <= 3 ? "RECIBIDA"
      : i <= 5 ? "EN_VALIDACION"
      : i <= 7 ? "RADICADA_EN_SIGOBIUS"
      : i <= 9 ? "ASIGNADA_A_ABOGADO"
      : i <= 11 ? "EN_PROCESO"
      : i <= 13 ? "MANDAMIENTO_DE_PAGO"
      : i <= 15 ? "MEDIDAS_CAUTELARES"
      : i <= 17 ? "CERRADA"
      : i <= 19 ? randomFrom(["DEVUELTA", "TERMINADA_SIN_PAGO"])
      : "RECIBIDA"

    const naturaleza = randomFrom(Naturalezas)
    const concepto = randomFrom(Conceptos)
    const monto = randomMonto()
    const sancionado = randomFrom(SancionadosNombres)

    // Asignar abogado si el estado lo requiere
    let abogadoId: string | null = null
    let fechaAsignacion: string | null = null
    if (["ASIGNADA_A_ABOGADO", "EN_PROCESO", "MANDAMIENTO_DE_PAGO", "MEDIDAS_CAUTELARES", "CERRADA", "TERMINADA_SIN_PAGO"].includes(estado) && abogadosIds.length > 0) {
      abogadoId = randomFrom(abogadosIds)
      fechaAsignacion = new Date(Date.now() - randomInt(1, 30) * 86400000).toISOString()
    }

    const fechaSolicitud = new Date(Date.now() - randomInt(0, 90) * 86400000).toISOString()
    const solicitudId = `SOL-2026-DEMO-${String(i).padStart(3, "0")}`

    const etapa_preliminar = {
      tramite: "Cobro Coactivo",
      concepto: concepto,
      naturaleza: naturaleza,
      noOrigen: generateRadicado(),
      competencia: juzgado.nombre,
      providencia: new Date(Date.now() - randomInt(30, 180) * 86400000).toISOString().split("T")[0],
      ejecutoria: new Date(Date.now() - randomInt(10, 60) * 86400000).toISOString().split("T")[0],
      folios: String(randomInt(10, 200)),
      dias: String(randomInt(30, 365)),
      cantidad: monto,
      cantidadLetras: "pesos colombianos",
      obligacion: "Pago de sanción impuesta mediante providencia judicial",
      cumpleRequisitos: true,
      tipoExpedienteDigital: true,
      observaciones: `Solicitud demo #${i} generada para pruebas de dashboard`,
    }

    // Insertar solicitud
    const { error: solError } = await supabase.from("solicitudes").insert({
      id: solicitudId,
      codigo_despacho: juzgado.codigo,
      nombre_juzgado: juzgado.nombre,
      funcionario_remitente: "Dr. Carlos Martínez",
      correo_institucional: `juzgado${i}@ramajudicial.gov.co`,
      radicado_origen: generateRadicado(),
      clase_proceso: randomFrom(Naturalezas),
      asunto: randomFrom(Conceptos),
      etapa_preliminar,
      estado,
      prioridad: randomFrom(["ALTA", "MEDIA", "BAJA"]),
      dias_sla: randomInt(5, 30),
      abogado_asignado_id: abogadoId,
      fecha_solicitud: fechaSolicitud,
      fecha_asignacion: fechaAsignacion,
      created_by: createdBy,
    })

    if (solError) {
      console.error(`Error en solicitud ${i}:`, solError.message)
      errores++
      continue
    }

    // Insertar sancionado
    const { error: sanError } = await supabase.from("sancionados").insert({
      solicitud_id: solicitudId,
      nombre_completo: sancionado.nombre,
      tipo_documento: sancionado.tipoDoc,
      numero_documento: sancionado.doc,
      tipo_persona: sancionado.tipo,
      cantidad_sancion: monto,
    })

    if (sanError) {
      console.error(`Error en sancionado ${i}:`, sanError.message)
    }

    insertados++
    console.log(`✅ Solicitud ${i}/20: ${solicitudId} | ${juzgado.nombre} | ${estado} | ${naturaleza} | $${(parseInt(monto)/1000000).toFixed(1)}M`)
  }

  console.log(`\n=== RESUMEN ===`)
  console.log(`Insertadas: ${insertados}`)
  console.log(`Errores: ${errores}`)
}

main().catch(console.error)
