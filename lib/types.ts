// Tipos de datos principales para el Sistema de Cobro Coactivo

export type UserRole = "JUZGADO" | "GESTOR" | "ABOGADO" | "ADMIN"

export type ClaseProceso = 
  | "DESACATO" 
  | "COSTAS" 
  | "REINTEGRO" 
  | "NO_PENAL" 
  | "DESACATO_FIDUPREVISORA"

export type Asunto = 
  | "PROVIDENCIA" 
  | "AUTO" 
  | "SENTENCIA" 
  | "CERTIFICACION_COBRO"

export type TipoDocumento = "CC" | "NIT" | "OTRO"

export type TipoPersona = "NATURAL" | "JURIDICA"

export type EstadoSolicitud = 
  | "RECIBIDA"
  | "EN_VALIDACION"
  | "DEVUELTA"
  | "DEVUELTA_AL_JUZGADO"
  | "RADICADA_EN_SIGOBIUS"
  | "ASIGNADA_A_ABOGADO"
  | "EN_PROCESO"
  | "MANDAMIENTO_DE_PAGO"
  | "MEDIDAS_CAUTELARES"
  | "RADICADO_SISTEMA_JUSTICIA"
  | "CERRADA"
  | "TERMINADA_SIN_PAGO"

export type Disponibilidad = "DISPONIBLE" | "MEDIA" | "NO_DISPONIBLE"

export type Prioridad = "ALTA" | "MEDIA" | "BAJA"

export interface Sancionado {
  id: string
  nombreCompleto: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  tipoPersona: TipoPersona
}

export interface DocumentoAdjunto {
  id: string
  nombre: string
  tipo: string
  url: string
  fechaCarga: Date
  esObligatorio: boolean
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: UserRole
  activo: boolean
  // Campos específicos para Juzgado
  codigoDespacho?: string
  nombreJuzgado?: string
  telefono?: string
  ciudad?: string
  // Campos específicos para Abogado
  especialidades?: ClaseProceso[]
  capacidadMaxima?: number
  disponibilidad?: Disponibilidad
  casosActivos?: number
}

export interface Solicitud {
  id: string
  fechaSolicitud: Date
  // Datos del despacho
  codigoDespacho: string
  nombreJuzgado: string
  funcionarioRemitente: string
  correoInstitucional: string
  telefonoDespacho: string
  ciudadDespacho: string
  // Datos del proceso
  radicadoOrigen: string // 23 dígitos
  claseProceso: ClaseProceso
  asunto: Asunto
  juzgadoConocimiento: string
  descripcionProceso: string
  // Personas involucradas
  sancionados: Sancionado[]
  // Documentos
  documentosAdjuntos: DocumentoAdjunto[]
  // Estado y seguimiento
  estado: EstadoSolicitud
  radicadoSIGOBIUS?: string
  abogadoAsignadoId?: string
  abogadoAsignado?: Usuario
  fechaRadicacion?: Date
  fechaAsignacion?: Date
  fechaCierre?: Date
  radicadoSistemaJusticia?: string
  observaciones?: string
  motivoDevolucion?: string
  motivoDevolucionAbogado?: string
  archivosRequeridos?: string
  prioridad: Prioridad
  diasSLA: number
  // Resultado del proceso (si cerrado)
  resultado?: string
  montoRecuperado?: number
  // Etapa Preliminar
  etapaPreliminar?: {
    tramite?: string
    concepto?: string
    naturaleza?: string
    noOrigen?: string
    competencia?: string
    providencia?: Date
    ejecutoria?: Date
    folios?: string
    dias?: string
    remisorio?: string
    plazo?: Date
    fechaLiquidacion?: Date
    tipo?: string
    cantidad?: string
    cantidadLetras?: string
    obligacion?: string
    obligacionLetras?: string
    cumpleRequisitos?: boolean
    tipoExpedienteFisico?: boolean
    tipoExpedienteDigital?: boolean
    observaciones?: string
  }
}

export interface LogAuditoria {
  id: string
  timestamp: Date
  usuarioId: string
  usuario?: Usuario
  solicitudId: string
  tipoAccion: string
  estadoAnterior?: EstadoSolicitud
  estadoNuevo?: EstadoSolicitud
  observaciones?: string
}

export interface Notificacion {
  id: string
  usuarioId: string
  tipo: string
  titulo: string
  mensaje: string
  solicitudId?: string
  leida: boolean
  fechaCreacion: Date
}

// Estadísticas para dashboards
export interface EstadisticasGenerales {
  totalProcesosActivos: number
  radicadosHoy: number
  cerradosEnPeriodo: number
  pendientesValidar: number
  alertasInactividad: number
  tasaDevolucion: number
}

export interface ProductividadAbogado {
  abogadoId: string
  nombre: string
  especialidades: ClaseProceso[]
  casosAsignados: number
  casosEnProceso: number
  casosCerrados: number
  diasPromedio: number
  cargaPorcentaje: number
}

export interface DistribucionProcesos {
  claseProceso: ClaseProceso
  cantidad: number
  porcentaje: number
  activos: number
  cerrados: number
}

// Labels para UI
export const CLASE_PROCESO_LABELS: Record<ClaseProceso, string> = {
  DESACATO: "Desacato",
  COSTAS: "Costas",
  REINTEGRO: "Reintegro",
  NO_PENAL: "No Penal",
  DESACATO_FIDUPREVISORA: "Desacato Fiduprevisora"
}

export const ASUNTO_LABELS: Record<Asunto, string> = {
  PROVIDENCIA: "Providencia",
  AUTO: "Auto",
  SENTENCIA: "Sentencia",
  CERTIFICACION_COBRO: "Certificación de Cobro"
}

export const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  RECIBIDA: "Recibida",
  EN_VALIDACION: "En Validación",
  DEVUELTA: "Devuelta por Gestor",
  DEVUELTA_AL_JUZGADO: "Devuelta al Juzgado",
  RADICADA_EN_SIGOBIUS: "Radicada en SIGOBIUS",
  ASIGNADA_A_ABOGADO: "Asignada a Abogado",
  EN_PROCESO: "En Proceso",
  MANDAMIENTO_DE_PAGO: "Mandamiento de Pago",
  MEDIDAS_CAUTELARES: "Medidas Cautelares",
  RADICADO_SISTEMA_JUSTICIA: "Radicado Sistema Justicia",
  CERRADA: "Cerrada",
  TERMINADA_SIN_PAGO: "Terminada sin Pago"
}

export const ESTADO_COLORS: Record<EstadoSolicitud, string> = {
  RECIBIDA: "bg-blue-100 text-blue-800",
  EN_VALIDACION: "bg-yellow-100 text-yellow-800",
  DEVUELTA: "bg-red-100 text-red-800",
  DEVUELTA_AL_JUZGADO: "bg-rose-100 text-rose-800",
  RADICADA_EN_SIGOBIUS: "bg-emerald-100 text-emerald-800",
  ASIGNADA_A_ABOGADO: "bg-indigo-100 text-indigo-800",
  EN_PROCESO: "bg-cyan-100 text-cyan-800",
  MANDAMIENTO_DE_PAGO: "bg-orange-100 text-orange-800",
  MEDIDAS_CAUTELARES: "bg-amber-100 text-amber-800",
  RADICADO_SISTEMA_JUSTICIA: "bg-teal-100 text-teal-800",
  CERRADA: "bg-green-100 text-green-800",
  TERMINADA_SIN_PAGO: "bg-gray-100 text-gray-800"
}

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  CC: "Cédula de Ciudadanía",
  NIT: "NIT",
  OTRO: "Otro"
}

export const TIPO_PERSONA_LABELS: Record<TipoPersona, string> = {
  NATURAL: "Persona Natural",
  JURIDICA: "Persona Jurídica"
}

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja"
}

export const PRIORIDAD_COLORS: Record<Prioridad, string> = {
  ALTA: "bg-red-100 text-red-800",
  MEDIA: "bg-yellow-100 text-yellow-800",
  BAJA: "bg-green-100 text-green-800"
}

export const DISPONIBILIDAD_LABELS: Record<Disponibilidad, string> = {
  DISPONIBLE: "Disponible",
  MEDIA: "Media",
  NO_DISPONIBLE: "No Disponible"
}

export const DISPONIBILIDAD_COLORS: Record<Disponibilidad, string> = {
  DISPONIBLE: "bg-green-100 text-green-800",
  MEDIA: "bg-yellow-100 text-yellow-800",
  NO_DISPONIBLE: "bg-red-100 text-red-800"
}
