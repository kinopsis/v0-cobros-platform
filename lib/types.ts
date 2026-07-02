// Tipos de datos principales para el Sistema de Cobro Coactivo

export type UserRole = "JUZGADO" | "GESTOR" | "ABOGADO" | "ADMIN"

export type Naturaleza =
  | "ARANCEL"
  | "INCAPACIDADES"
  | "MULTA_CAMARA_COMERCIO"
  | "MULTA_CAUCIONES"
  | "MULTA_COMISARIAS_FAMILIA"
  | "MULTA_CONVERSION_DEPOSITO_JUDICIAL"
  | "MULTA_CORRECCIONAL"
  | "MULTA_INCIDENTE_DESACATO"
  | "MULTA_INCUMPLIMIENTO_CONTRACTUAL"
  | "MULTA_INDEMNIZACION_CAUCIONES"
  | "MULTA_JUECES_PAZ"
  | "MULTA_JURAMENTO_ESTIMATORIO"
  | "MULTA_JURISDICCION_ADMINISTRATIVA"
  | "MULTA_JURISDICCION_CIVIL"
  | "MULTA_JURISDICCION_FAMILIA"
  | "MULTA_JURISDICCION_LABORAL"

export type Concepto =
  | "MULTAS_ADMINISTRATIVAS"
  | "ARANCEL"
  | "MULTAS"
  | "REINTEGRO"
  | "INCAPACIDAD"
  | "POLIZA"

export type TipoDocumento = "CC" | "NIT" | "OTRO"

export type TipoPersona = "NATURAL" | "JURIDICA"

export type EstadoSolicitud = 
  | "EN_VALIDACION"
  | "RADICADA_EN_SIGOBIUS"
  | "ASIGNADA_A_ABOGADO"
  | "DEVUELTA_POR_GESTOR"
  | "DEVUELTA_POR_ABOGADO"
  | "RADICADA_EN_GCC"

export type Disponibilidad = "DISPONIBLE" | "MEDIA" | "NO_DISPONIBLE"

export type Prioridad = "ALTA" | "MEDIA" | "BAJA"

export interface Sancionado {
  id: string
  nombreCompleto: string
  tipoDocumento: TipoDocumento
  numeroDocumento: string
  tipoPersona: TipoPersona
  direccion?: string
  ciudad?: string
  tipoSancion?: string
  cantidadSancion?: string
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
  especialidades?: Naturaleza[]
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
  naturaleza: Naturaleza
  concepto: Concepto
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
  naturaleza: Naturaleza
  cantidad: number
  porcentaje: number
  activos: number
  cerrados: number
}

// Labels para UI
export const NATURALEZA_LABELS: Record<Naturaleza, string> = {
  ARANCEL: "ARANCEL - ARANCEL",
  INCAPACIDADES: "INCAPACIDAD - INCAPACIDADES",
  MULTA_CAMARA_COMERCIO: "MULTA - CÁMARA DE COMERCIO",
  MULTA_CAUCIONES: "MULTA - CAUCIONES",
  MULTA_COMISARIAS_FAMILIA: "MULTA - COMISARIAS DE FAMILIA",
  MULTA_CONVERSION_DEPOSITO_JUDICIAL: "MULTA - CONVERSIÓN DEPÓSITO JUDICIAL CONSIG. CUENTA DESP",
  MULTA_CORRECCIONAL: "MULTA - CORRECCIONAL - TODAS LAS JURISDICCIONES",
  MULTA_INCIDENTE_DESACATO: "MULTA - INCIDENTE DE DESACATO",
  MULTA_INCUMPLIMIENTO_CONTRACTUAL: "MULTA - INCUMPLIMIENTO CONTRACTUAL",
  MULTA_INDEMNIZACION_CAUCIONES: "MULTA - INDEMNIZACIÓN POR CAUCIONES",
  MULTA_JUECES_PAZ: "MULTA - JUECES DE PAZ",
  MULTA_JURAMENTO_ESTIMATORIO: "MULTA - JURAMENTO ESTIMATORIO",
  MULTA_JURISDICCION_ADMINISTRATIVA: "MULTA - JURISDICCIÓN ADMINISTRATIVA",
  MULTA_JURISDICCION_CIVIL: "MULTA - JURISDICCIÓN CIVIL",
  MULTA_JURISDICCION_FAMILIA: "MULTA - JURISDICCIÓN FAMILIA",
  MULTA_JURISDICCION_LABORAL: "MULTA - JURISDICCIÓN LABORAL",
}

export const CONCEPTO_LABELS: Record<Concepto, string> = {
  MULTAS_ADMINISTRATIVAS: "Multas administrativas (Urbanísticas, ambientales, disciplinarias, de tránsito, correccionales)",
  ARANCEL: "ARANCEL (Obligaciones tributarias: Impuestos, tasas, contribuciones, intereses y sanciones tributarias)",
  MULTAS: "MULTAS (Incumplimientos contractuales: Cláusulas penales pecuniarias, multas por incumplimiento de contratos estatales)",
  REINTEGRO: "REINTEGRO (Pagos indebidos, Subsidios, incapacidades, licencias, prestaciones recibidas sin derecho)",
  INCAPACIDAD: "INCAPACIDAD",
  POLIZA: "PÓLIZA",
}

// Alias de compatibilidad (deprecados)
export type ClaseProceso = Naturaleza
export type Asunto = Concepto
export const CLASE_PROCESO_LABELS = NATURALEZA_LABELS
export const ASUNTO_LABELS = CONCEPTO_LABELS

export const ESTADO_LABELS: Record<EstadoSolicitud, string> = {
  EN_VALIDACION: "En Validación",
  RADICADA_EN_SIGOBIUS: "Radicada en SIGOBIUS",
  ASIGNADA_A_ABOGADO: "Asignada a Abogado",
  DEVUELTA_POR_GESTOR: "Devuelta por Gestor",
  DEVUELTA_POR_ABOGADO: "Devuelta por Abogado",
  RADICADA_EN_GCC: "Radicada en GCC",
}

export const ESTADO_COLORS: Record<EstadoSolicitud, string> = {
  EN_VALIDACION: "bg-yellow-100 text-yellow-800",
  RADICADA_EN_SIGOBIUS: "bg-emerald-100 text-emerald-800",
  ASIGNADA_A_ABOGADO: "bg-indigo-100 text-indigo-800",
  DEVUELTA_POR_GESTOR: "bg-red-100 text-red-800",
  DEVUELTA_POR_ABOGADO: "bg-orange-100 text-orange-800",
  RADICADA_EN_GCC: "bg-green-100 text-green-800",
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
