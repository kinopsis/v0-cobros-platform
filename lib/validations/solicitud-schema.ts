import { z } from "zod"

// El formulario envía sancionados con campos en camelCase.
// El POST handler se encarga de mapear a snake_case para la BD.
const sancionadoSchema = z.object({
  nombreCompleto: z.string().optional(),
  nombre_completo: z.string().optional(),
  tipoDocumento: z.string().optional(),
  tipo_documento: z.string().optional(),
  numeroDocumento: z.string().optional(),
  numero_documento: z.string().optional(),
  tipoPersona: z.string().optional(),
  tipo_persona: z.string().optional(),
  direccion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  tipoSancion: z.string().optional().nullable(),
  tipo_sancion: z.string().optional().nullable(),
  cantidadSancion: z.union([z.string(), z.number()]).optional().nullable(),
  cantidad_sancion: z.union([z.string(), z.number()]).optional().nullable(),
})

export const solicitudCreateSchema = z.object({
  radicado_origen: z.string().min(1, "El radicado de origen es requerido"),
  // El formulario envía labels descriptivos (ej: "MULTA - INDEMNIZACIÓN POR CAUCIONES")
  // El POST handler los mapea a clase_proceso para la BD
  naturaleza: z.string().min(1, "La naturaleza del proceso es requerida"),
  concepto: z.string().min(1, "El concepto es requerido"),
  sancionados: z.array(sancionadoSchema).min(1, "Debe incluir al menos un sancionado"),
  etapa_preliminar: z.object({}).passthrough().optional().nullable(),
  estado: z.enum(["BORRADOR", "EN_VALIDACION"]).optional(),
})

export type SolicitudCreateInput = z.infer<typeof solicitudCreateSchema>
export type SancionadoInput = z.infer<typeof sancionadoSchema>
