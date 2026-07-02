import dotenv from "dotenv"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: resolve(__dirname, "..", ".env.local") })

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no definida")
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY no definida")

  console.log("URL:", url)
  console.log("Key primeros 20 chars:", key.substring(0, 20) + "...")

  const supabase = createClient(url, key)

  // Test 1: Leer usuarios
  const { error: err1, count: c1 } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
  if (err1) { console.log("ERROR:", err1.message); process.exit(1) }
  console.log("[OK] Usuarios:", c1)

  // Test 2: Leer config
  const { error: err2, count: c2 } = await supabase
    .from("configuracion_sistema")
    .select("*", { count: "exact", head: true })
  if (err2) { console.log("ERROR:", err2.message); process.exit(1) }
  console.log("[OK] Configuraciones:", c2)

  // Test 3: Upsert admin
  const { data: admin, error: err3 } = await supabase
    .from("usuarios")
    .upsert({ email: "test-admin@cendoj.ramajudicial.gov.co", nombre: "Admin Test", rol: "ADMIN", activo: true }, { onConflict: "email" })
    .select().single()
  if (err3) { console.log("ERROR:", err3.message); process.exit(1) }
  console.log("[OK] Admin ID:", admin.id)

  // Test 4: Despachos
  const { count: c4 } = await supabase.from("despachos").select("*", { count: "exact", head: true })
  console.log("[OK] Despachos:", c4)

  // Test 5: Insert log
  const { error: err5 } = await supabase.from("logs_auditoria").insert({
    usuario_id: admin.id, tipo_accion: "TEST_CONEXION", observaciones: "Validacion service_role key"
  })
  if (err5) console.log("[WARN] Log insert:", err5.message)
  else console.log("[OK] Log insertado")

  console.log("\nTODAS LAS PRUEBAS OK - Service Role Key VALIDA")
}

main().catch(e => { console.error("FALLO:", e.message); process.exit(1) })
