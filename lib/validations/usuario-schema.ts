import { z } from "zod"

export const ROLES = ["JUZGADO", "GESTOR", "ABOGADO", "ADMIN"] as const
export const DISPONIBILIDADES = ["DISPONIBLE", "MEDIA", "NO_DISPONIBLE"] as const
export const CLASES_PROCESO = [
  "DESACATO",
  "COSTAS",
  "REINTEGRO",
  "NO_PENAL",
  "DESACATO_FIDUPREVISORA",
] as const

export const usuarioBaseSchema = z.object({
  email: z.string().email("Email invalido"),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  rol: z.enum(ROLES, { required_error: "El rol es requerido" }),
  activo: z.boolean().default(true),
})

export const usuarioCreateSchema = usuarioBaseSchema.extend({
  // Campos juzgado
  codigo_despacho: z.string().optional(),
  nombre_juzgado: z.string().optional(),
  telefono: z.string().optional(),
  ciudad: z.string().optional(),
  distrito: z.string().optional(),
  circuito: z.string().optional(),
  // Campos abogado
  especialidades: z.array(z.enum(CLASES_PROCESO)).optional(),
  capacidad_maxima: z.number().min(1).max(50).default(20),
  disponibilidad: z.enum(DISPONIBILIDADES).default("DISPONIBLE"),
})

export const usuarioUpdateSchema = usuarioBaseSchema.partial().extend({
  id: z.string().uuid("ID de usuario invalido"),
  codigo_despacho: z.string().optional(),
  nombre_juzgado: z.string().optional(),
  telefono: z.string().optional(),
  ciudad: z.string().optional(),
  distrito: z.string().optional(),
  circuito: z.string().optional(),
  especialidades: z.array(z.enum(CLASES_PROCESO)).optional(),
  capacidad_maxima: z.number().min(1).max(50).optional(),
  disponibilidad: z.enum(DISPONIBILIDADES).optional(),
})

export const usuarioBulkSchema = z.object({
  ids: z.array(z.string().uuid()),
  accion: z.enum(["activar", "desactivar"]),
})

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>
export type UsuarioBulkInput = z.infer<typeof usuarioBulkSchema>
