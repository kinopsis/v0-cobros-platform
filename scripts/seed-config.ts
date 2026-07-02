/**
 * Script para insertar valores iniciales de configuracion del sistema.
 *
 * Uso: npx tsx scripts/seed-config.ts
 *
 * Requiere variables de entorno:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: resolve(__dirname, "..", ".env.local") })

const CONFIGURACIONES = [
  // General
  { seccion: "general", clave: "nombre_entidad", valor: "Direccion Seccional de Administracion Judicial - Antioquia" },
  { seccion: "general", clave: "email_contacto", valor: "contacto@desaj-antioquia.gov.co" },
  { seccion: "general", clave: "telefono_contacto", valor: "+57 4 xxx-xxxx" },
  { seccion: "general", clave: "direccion", valor: "Carrera 50 #54-20, Medellin, Colombia" },

  // Cobro
  { seccion: "cobro", clave: "plazo_maximo_gestion", valor: "45" },
  { seccion: "cobro", clave: "monto_minimo_coactiva", valor: "500000" },
  { seccion: "cobro", clave: "intereses_moratorios", valor: "1.5" },
  { seccion: "cobro", clave: "comision_gestion", valor: "10" },
  { seccion: "cobro", clave: "dias_sla_desacato", valor: "15" },
  { seccion: "cobro", clave: "dias_sla_costas", valor: "20" },
  { seccion: "cobro", clave: "dias_sla_reintegro", valor: "25" },
  { seccion: "cobro", clave: "dias_sla_no_penal", valor: "30" },

  // Notificaciones
  { seccion: "notificaciones", clave: "email_habilitado", valor: "true" },
  { seccion: "notificaciones", clave: "sms_habilitado", valor: "false" },
  { seccion: "notificaciones", clave: "sistema_habilitado", valor: "true" },
  { seccion: "notificaciones", clave: "emails_criticos", valor: "contacto@desaj-antioquia.gov.co" },

  // Seguridad
  { seccion: "seguridad", clave: "tiempo_sesion_minutos", valor: "30" },
  { seccion: "seguridad", clave: "max_intentos_acceso", valor: "5" },
  { seccion: "seguridad", clave: "politica_contrasenas", valor: "fuerte" },
  { seccion: "seguridad", clave: "mfa_habilitado", valor: "true" },

  // Office 365
  { seccion: "office365", clave: "tenant_id", valor: "" },
  { seccion: "office365", clave: "client_id", valor: "" },
  { seccion: "office365", clave: "dominio_permitido", valor: "cendoj.ramajudicial.gov.co" },
  { seccion: "office365", clave: "sync_automatico", valor: "false" },
  { seccion: "office365", clave: "ultima_sync", valor: "" },
  { seccion: "office365", clave: "sync_hora", valor: "02:00" },
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
  console.log(`Insertando ${CONFIGURACIONES.length} valores de configuracion...\n`)

  const { error } = await supabase
    .from("configuracion_sistema")
    .upsert(CONFIGURACIONES, {
      onConflict: "seccion,clave",
      ignoreDuplicates: false,
    })

  if (error) {
    console.error("ERROR:", error.message)
    process.exit(1)
  }

  console.log("OK: Configuracion inicial insertada correctamente.")
  console.log(`\nSecciones: general(${CONFIGURACIONES.filter(c => c.seccion === "general").length}), cobro(${CONFIGURACIONES.filter(c => c.seccion === "cobro").length}), notificaciones(${CONFIGURACIONES.filter(c => c.seccion === "notificaciones").length}), seguridad(${CONFIGURACIONES.filter(c => c.seccion === "seguridad").length}), office365(${CONFIGURACIONES.filter(c => c.seccion === "office365").length})`)
}

main().catch(console.error)
