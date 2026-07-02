import { z } from "zod"

export const configuracionUpdateSchema = z.object({
  configuraciones: z.array(
    z.object({
      seccion: z.string().min(1),
      clave: z.string().min(1),
      valor: z.string(),
    })
  ).min(1, "Debe enviar al menos una configuracion"),
})

export const office365TestSchema = z.object({
  tenantId: z.string().min(1, "Tenant ID es requerido"),
  clientId: z.string().min(1, "Client ID es requerido"),
  clientSecret: z.string().min(1, "Client Secret es requerido"),
})

export type ConfiguracionUpdateInput = z.infer<typeof configuracionUpdateSchema>
export type Office365TestInput = z.infer<typeof office365TestSchema>
