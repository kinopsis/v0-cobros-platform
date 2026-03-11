import { 
  Usuario, 
  Solicitud, 
  EstadisticasGenerales, 
  ProductividadAbogado,
  DistribucionProcesos,
  Notificacion,
  LogAuditoria
} from "./types"

// Usuarios de prueba
export const mockUsuarios: Usuario[] = [
  // Juzgados
  {
    id: "juz-001",
    email: "juzgado1.civil@ramajudicial.gov.co",
    nombre: "Dr. Carlos Martínez",
    rol: "JUZGADO",
    activo: true,
    codigoDespacho: "JAD04-MED-2024",
    nombreJuzgado: "Juzgado 1 Civil del Circuito de Medellín",
    telefono: "(604) 444-5566",
    ciudad: "Medellín"
  },
  {
    id: "juz-002",
    email: "juzgado2.penal@ramajudicial.gov.co",
    nombre: "Dra. María López",
    rol: "JUZGADO",
    activo: true,
    codigoDespacho: "JAD08-MED-2024",
    nombreJuzgado: "Juzgado 2 Penal del Circuito de Medellín",
    telefono: "(604) 444-7788",
    ciudad: "Medellín"
  },
  {
    id: "juz-003",
    email: "tribunal.admin@ramajudicial.gov.co",
    nombre: "Dr. Roberto Gómez",
    rol: "JUZGADO",
    activo: true,
    codigoDespacho: "TAD01-MED-2024",
    nombreJuzgado: "Tribunal Administrativo de Antioquia",
    telefono: "(604) 444-9900",
    ciudad: "Medellín"
  },
  // Gestores
  {
    id: "ges-001",
    email: "gestion1@desaj.gov.co",
    nombre: "Ana Patricia Restrepo",
    rol: "GESTOR",
    activo: true
  },
  {
    id: "ges-002",
    email: "gestion2@desaj.gov.co",
    nombre: "Juan David Ospina",
    rol: "GESTOR",
    activo: true
  },
  // Abogados
  {
    id: "abo-001",
    email: "diana.ramirez@desaj.gov.co",
    nombre: "Diana Ramírez",
    rol: "ABOGADO",
    activo: true,
    especialidades: ["DESACATO", "DESACATO_FIDUPREVISORA"],
    capacidadMaxima: 20,
    disponibilidad: "MEDIA",
    casosActivos: 15
  },
  {
    id: "abo-002",
    email: "ricardo.valencia@desaj.gov.co",
    nombre: "Ricardo Valencia",
    rol: "ABOGADO",
    activo: true,
    especialidades: ["NO_PENAL", "COSTAS", "DESACATO"],
    capacidadMaxima: 20,
    disponibilidad: "DISPONIBLE",
    casosActivos: 12
  },
  {
    id: "abo-003",
    email: "sabiny.gutierrez@desaj.gov.co",
    nombre: "Sabiny Gutiérrez",
    rol: "ABOGADO",
    activo: true,
    especialidades: ["DESACATO_FIDUPREVISORA", "COSTAS"],
    capacidadMaxima: 20,
    disponibilidad: "MEDIA",
    casosActivos: 14
  },
  {
    id: "abo-004",
    email: "tatiana.moreno@desaj.gov.co",
    nombre: "Tatiana Moreno",
    rol: "ABOGADO",
    activo: true,
    especialidades: ["REINTEGRO"],
    capacidadMaxima: 15,
    disponibilidad: "DISPONIBLE",
    casosActivos: 8
  },
  // Administradores
  {
    id: "adm-001",
    email: "director@desaj.gov.co",
    nombre: "Dr. Gabriel Pulgarín",
    rol: "ADMIN",
    activo: true
  }
]

// Solicitudes de prueba
export const mockSolicitudes: Solicitud[] = [
  {
    id: "SOL-2026-00001",
    fechaSolicitud: new Date("2026-03-01"),
    codigoDespacho: "JAD04-MED-2024",
    nombreJuzgado: "Juzgado 1 Civil del Circuito de Medellín",
    funcionarioRemitente: "Dr. Carlos Martínez",
    correoInstitucional: "juzgado1.civil@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-5566",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500120260001200",
    claseProceso: "DESACATO",
    asunto: "PROVIDENCIA",
    juzgadoConocimiento: "Juzgado 1 Civil del Circuito",
    descripcionProceso: "Desacato por incumplimiento de orden judicial en proceso de tutela. El accionado no ha dado cumplimiento a la sentencia proferida.",
    sancionados: [
      {
        id: "san-001",
        nombreCompleto: "Empresa ABC S.A.S.",
        tipoDocumento: "NIT",
        numeroDocumento: "900123456-7",
        tipoPersona: "JURIDICA"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-001",
        nombre: "providencia_desacato.pdf",
        tipo: "application/pdf",
        url: "/docs/providencia_desacato.pdf",
        fechaCarga: new Date("2026-03-01"),
        esObligatorio: true
      }
    ],
    estado: "ASIGNADA_A_ABOGADO",
    radicadoSIGOBIUS: "EXT-DESAJ-ME26-00001",
    abogadoAsignadoId: "abo-001",
    fechaRadicacion: new Date("2026-03-02"),
    fechaAsignacion: new Date("2026-03-02"),
    prioridad: "ALTA",
    diasSLA: 5
  },
  {
    id: "SOL-2026-00002",
    fechaSolicitud: new Date("2026-03-03"),
    codigoDespacho: "JAD08-MED-2024",
    nombreJuzgado: "Juzgado 2 Penal del Circuito de Medellín",
    funcionarioRemitente: "Dra. María López",
    correoInstitucional: "juzgado2.penal@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-7788",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500220260002300",
    claseProceso: "COSTAS",
    asunto: "SENTENCIA",
    juzgadoConocimiento: "Juzgado 2 Penal del Circuito",
    descripcionProceso: "Cobro de costas procesales derivadas de sentencia ejecutoriada.",
    sancionados: [
      {
        id: "san-002",
        nombreCompleto: "Pedro José Rodríguez",
        tipoDocumento: "CC",
        numeroDocumento: "1128456789",
        tipoPersona: "NATURAL"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-002",
        nombre: "sentencia_costas.pdf",
        tipo: "application/pdf",
        url: "/docs/sentencia_costas.pdf",
        fechaCarga: new Date("2026-03-03"),
        esObligatorio: true
      }
    ],
    estado: "EN_PROCESO",
    radicadoSIGOBIUS: "EXT-DESAJ-ME26-00002",
    abogadoAsignadoId: "abo-002",
    fechaRadicacion: new Date("2026-03-04"),
    fechaAsignacion: new Date("2026-03-04"),
    prioridad: "MEDIA",
    diasSLA: 12
  },
  {
    id: "SOL-2026-00003",
    fechaSolicitud: new Date("2026-03-05"),
    codigoDespacho: "TAD01-MED-2024",
    nombreJuzgado: "Tribunal Administrativo de Antioquia",
    funcionarioRemitente: "Dr. Roberto Gómez",
    correoInstitucional: "tribunal.admin@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-9900",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500320260003400",
    claseProceso: "REINTEGRO",
    asunto: "AUTO",
    juzgadoConocimiento: "Tribunal Administrativo",
    descripcionProceso: "Reintegro de funcionario por nulidad de acto administrativo de desvinculación.",
    sancionados: [
      {
        id: "san-003",
        nombreCompleto: "Alcaldía de Medellín",
        tipoDocumento: "NIT",
        numeroDocumento: "890905211-1",
        tipoPersona: "JURIDICA"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-003",
        nombre: "auto_reintegro.pdf",
        tipo: "application/pdf",
        url: "/docs/auto_reintegro.pdf",
        fechaCarga: new Date("2026-03-05"),
        esObligatorio: true
      }
    ],
    estado: "RECIBIDA",
    prioridad: "ALTA",
    diasSLA: 3
  },
  {
    id: "SOL-2026-00004",
    fechaSolicitud: new Date("2026-03-06"),
    codigoDespacho: "JAD04-MED-2024",
    nombreJuzgado: "Juzgado 1 Civil del Circuito de Medellín",
    funcionarioRemitente: "Dr. Carlos Martínez",
    correoInstitucional: "juzgado1.civil@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-5566",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500420260004500",
    claseProceso: "DESACATO_FIDUPREVISORA",
    asunto: "PROVIDENCIA",
    juzgadoConocimiento: "Juzgado 1 Civil del Circuito",
    descripcionProceso: "Desacato por incumplimiento de orden de pago de pensión a través de Fiduprevisora.",
    sancionados: [
      {
        id: "san-004",
        nombreCompleto: "Fiduprevisora S.A.",
        tipoDocumento: "NIT",
        numeroDocumento: "800126785-2",
        tipoPersona: "JURIDICA"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-004",
        nombre: "providencia_fiduprevisora.pdf",
        tipo: "application/pdf",
        url: "/docs/providencia_fiduprevisora.pdf",
        fechaCarga: new Date("2026-03-06"),
        esObligatorio: true
      }
    ],
    estado: "EN_VALIDACION",
    prioridad: "MEDIA",
    diasSLA: 8
  },
  {
    id: "SOL-2026-00005",
    fechaSolicitud: new Date("2026-03-07"),
    codigoDespacho: "JAD08-MED-2024",
    nombreJuzgado: "Juzgado 2 Penal del Circuito de Medellín",
    funcionarioRemitente: "Dra. María López",
    correoInstitucional: "juzgado2.penal@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-7788",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500520260005600",
    claseProceso: "NO_PENAL",
    asunto: "SENTENCIA",
    juzgadoConocimiento: "Juzgado 2 Penal del Circuito",
    descripcionProceso: "Cobro coactivo por multa impuesta en proceso no penal.",
    sancionados: [
      {
        id: "san-005",
        nombreCompleto: "Laura Patricia González",
        tipoDocumento: "CC",
        numeroDocumento: "43876543",
        tipoPersona: "NATURAL"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-005",
        nombre: "sentencia_multa.pdf",
        tipo: "application/pdf",
        url: "/docs/sentencia_multa.pdf",
        fechaCarga: new Date("2026-03-07"),
        esObligatorio: true
      }
    ],
    estado: "MANDAMIENTO_DE_PAGO",
    radicadoSIGOBIUS: "EXT-DESAJ-ME26-00003",
    abogadoAsignadoId: "abo-002",
    fechaRadicacion: new Date("2026-03-08"),
    fechaAsignacion: new Date("2026-03-08"),
    prioridad: "BAJA",
    diasSLA: 15
  },
  {
    id: "SOL-2026-00006",
    fechaSolicitud: new Date("2026-02-15"),
    codigoDespacho: "JAD04-MED-2024",
    nombreJuzgado: "Juzgado 1 Civil del Circuito de Medellín",
    funcionarioRemitente: "Dr. Carlos Martínez",
    correoInstitucional: "juzgado1.civil@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-5566",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500620260006700",
    claseProceso: "COSTAS",
    asunto: "AUTO",
    juzgadoConocimiento: "Juzgado 1 Civil del Circuito",
    descripcionProceso: "Cobro de costas por incidente resuelto en proceso civil.",
    sancionados: [
      {
        id: "san-006",
        nombreCompleto: "Constructora XYZ Ltda.",
        tipoDocumento: "NIT",
        numeroDocumento: "800567890-3",
        tipoPersona: "JURIDICA"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-006",
        nombre: "auto_costas.pdf",
        tipo: "application/pdf",
        url: "/docs/auto_costas.pdf",
        fechaCarga: new Date("2026-02-15"),
        esObligatorio: true
      }
    ],
    estado: "CERRADA",
    radicadoSIGOBIUS: "EXT-DESAJ-ME26-00004",
    abogadoAsignadoId: "abo-003",
    fechaRadicacion: new Date("2026-02-16"),
    fechaAsignacion: new Date("2026-02-16"),
    fechaCierre: new Date("2026-03-01"),
    radicadoSistemaJusticia: "05001310500620260006799",
    resultado: "Pago efectuado",
    montoRecuperado: 5250000,
    prioridad: "MEDIA",
    diasSLA: 0
  },
  {
    id: "SOL-2026-00007",
    fechaSolicitud: new Date("2026-03-09"),
    codigoDespacho: "TAD01-MED-2024",
    nombreJuzgado: "Tribunal Administrativo de Antioquia",
    funcionarioRemitente: "Dr. Roberto Gómez",
    correoInstitucional: "tribunal.admin@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-9900",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500720260007800",
    claseProceso: "DESACATO",
    asunto: "PROVIDENCIA",
    juzgadoConocimiento: "Tribunal Administrativo",
    descripcionProceso: "Desacato por incumplimiento de fallo de acción popular.",
    sancionados: [
      {
        id: "san-007",
        nombreCompleto: "Gobernación de Antioquia",
        tipoDocumento: "NIT",
        numeroDocumento: "890980066-1",
        tipoPersona: "JURIDICA"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-007",
        nombre: "providencia_accion_popular.pdf",
        tipo: "application/pdf",
        url: "/docs/providencia_accion_popular.pdf",
        fechaCarga: new Date("2026-03-09"),
        esObligatorio: true
      }
    ],
    estado: "DEVUELTA",
    motivoDevolucion: "Falta certificación de ejecutoria del fallo. Se requiere adjuntar constancia de notificación a las partes.",
    prioridad: "MEDIA",
    diasSLA: 10
  },
  {
    id: "SOL-2026-00008",
    fechaSolicitud: new Date("2026-03-10"),
    codigoDespacho: "JAD04-MED-2024",
    nombreJuzgado: "Juzgado 1 Civil del Circuito de Medellín",
    funcionarioRemitente: "Dr. Carlos Martínez",
    correoInstitucional: "juzgado1.civil@ramajudicial.gov.co",
    telefonoDespacho: "(604) 444-5566",
    ciudadDespacho: "Medellín",
    radicadoOrigen: "05001310500820260008900",
    claseProceso: "REINTEGRO",
    asunto: "SENTENCIA",
    juzgadoConocimiento: "Juzgado 1 Civil del Circuito",
    descripcionProceso: "Reintegro laboral por despido sin justa causa.",
    sancionados: [
      {
        id: "san-008",
        nombreCompleto: "Hospital San Vicente Fundación",
        tipoDocumento: "NIT",
        numeroDocumento: "890909659-0",
        tipoPersona: "JURIDICA"
      }
    ],
    documentosAdjuntos: [
      {
        id: "doc-008",
        nombre: "sentencia_reintegro.pdf",
        tipo: "application/pdf",
        url: "/docs/sentencia_reintegro.pdf",
        fechaCarga: new Date("2026-03-10"),
        esObligatorio: true
      }
    ],
    estado: "RADICADA_EN_SIGOBIUS",
    radicadoSIGOBIUS: "EXT-DESAJ-ME26-00005",
    fechaRadicacion: new Date("2026-03-11"),
    prioridad: "ALTA",
    diasSLA: 2
  }
]

// Estadísticas generales
export const mockEstadisticas: EstadisticasGenerales = {
  totalProcesosActivos: 49,
  radicadosHoy: 2,
  cerradosEnPeriodo: 13,
  pendientesValidar: 3,
  alertasInactividad: 11,
  tasaDevolucion: 8
}

// Productividad por abogado
export const mockProductividadAbogados: ProductividadAbogado[] = [
  {
    abogadoId: "abo-001",
    nombre: "Diana Ramírez",
    especialidades: ["DESACATO", "DESACATO_FIDUPREVISORA"],
    casosAsignados: 15,
    casosEnProceso: 10,
    casosCerrados: 4,
    diasPromedio: 12.3,
    cargaPorcentaje: 75
  },
  {
    abogadoId: "abo-002",
    nombre: "Ricardo Valencia",
    especialidades: ["NO_PENAL", "COSTAS", "DESACATO"],
    casosAsignados: 12,
    casosEnProceso: 8,
    casosCerrados: 3,
    diasPromedio: 9.8,
    cargaPorcentaje: 60
  },
  {
    abogadoId: "abo-003",
    nombre: "Sabiny Gutiérrez",
    especialidades: ["DESACATO_FIDUPREVISORA", "COSTAS"],
    casosAsignados: 14,
    casosEnProceso: 9,
    casosCerrados: 4,
    diasPromedio: 14.1,
    cargaPorcentaje: 70
  },
  {
    abogadoId: "abo-004",
    nombre: "Tatiana Moreno",
    especialidades: ["REINTEGRO"],
    casosAsignados: 8,
    casosEnProceso: 5,
    casosCerrados: 2,
    diasPromedio: 11.5,
    cargaPorcentaje: 53
  }
]

// Distribución por tipo de proceso
export const mockDistribucionProcesos: DistribucionProcesos[] = [
  { claseProceso: "DESACATO", cantidad: 18, porcentaje: 37, activos: 14, cerrados: 4 },
  { claseProceso: "COSTAS", cantidad: 12, porcentaje: 24, activos: 8, cerrados: 4 },
  { claseProceso: "REINTEGRO", cantidad: 8, porcentaje: 16, activos: 6, cerrados: 2 },
  { claseProceso: "NO_PENAL", cantidad: 7, porcentaje: 14, activos: 5, cerrados: 2 },
  { claseProceso: "DESACATO_FIDUPREVISORA", cantidad: 4, porcentaje: 8, activos: 3, cerrados: 1 }
]

// Notificaciones de ejemplo
export const mockNotificaciones: Notificacion[] = [
  {
    id: "not-001",
    usuarioId: "juz-001",
    tipo: "SOLICITUD_RADICADA",
    titulo: "Solicitud radicada exitosamente",
    mensaje: "Su solicitud SOL-2026-00001 ha sido radicada con el número SIGOBIUS EXT-DESAJ-ME26-00001",
    solicitudId: "SOL-2026-00001",
    leida: true,
    fechaCreacion: new Date("2026-03-02")
  },
  {
    id: "not-002",
    usuarioId: "abo-001",
    tipo: "CASO_ASIGNADO",
    titulo: "Nuevo caso asignado",
    mensaje: "Se le ha asignado el caso SOL-2026-00001 - Desacato contra Empresa ABC S.A.S.",
    solicitudId: "SOL-2026-00001",
    leida: false,
    fechaCreacion: new Date("2026-03-02")
  },
  {
    id: "not-003",
    usuarioId: "juz-003",
    tipo: "SOLICITUD_DEVUELTA",
    titulo: "Solicitud devuelta para corrección",
    mensaje: "La solicitud SOL-2026-00007 ha sido devuelta. Motivo: Falta certificación de ejecutoria del fallo.",
    solicitudId: "SOL-2026-00007",
    leida: false,
    fechaCreacion: new Date("2026-03-10")
  },
  {
    id: "not-004",
    usuarioId: "ges-001",
    tipo: "ALERTA_INACTIVIDAD",
    titulo: "Alerta de inactividad",
    mensaje: "El caso SOL-2026-00002 lleva más de 15 días sin actuación.",
    solicitudId: "SOL-2026-00002",
    leida: false,
    fechaCreacion: new Date("2026-03-11")
  }
]

// Logs de auditoría de ejemplo
export const mockLogsAuditoria: LogAuditoria[] = [
  {
    id: "log-001",
    timestamp: new Date("2026-03-01T09:00:00"),
    usuarioId: "juz-001",
    solicitudId: "SOL-2026-00001",
    tipoAccion: "CREACION",
    estadoNuevo: "RECIBIDA",
    observaciones: "Solicitud creada desde portal de juzgados"
  },
  {
    id: "log-002",
    timestamp: new Date("2026-03-02T10:30:00"),
    usuarioId: "ges-001",
    solicitudId: "SOL-2026-00001",
    tipoAccion: "VALIDACION",
    estadoAnterior: "RECIBIDA",
    estadoNuevo: "RADICADA_EN_SIGOBIUS",
    observaciones: "Solicitud validada y radicada en SIGOBIUS"
  },
  {
    id: "log-003",
    timestamp: new Date("2026-03-02T11:00:00"),
    usuarioId: "ges-001",
    solicitudId: "SOL-2026-00001",
    tipoAccion: "ASIGNACION",
    estadoAnterior: "RADICADA_EN_SIGOBIUS",
    estadoNuevo: "ASIGNADA_A_ABOGADO",
    observaciones: "Caso asignado a Diana Ramírez"
  }
]

// Helper para obtener usuario por ID
export function getUsuarioById(id: string): Usuario | undefined {
  return mockUsuarios.find(u => u.id === id)
}

// Helper para obtener solicitudes por estado
export function getSolicitudesByEstado(estado: string): Solicitud[] {
  return mockSolicitudes.filter(s => s.estado === estado)
}

// Helper para obtener solicitudes por abogado
export function getSolicitudesByAbogado(abogadoId: string): Solicitud[] {
  return mockSolicitudes.filter(s => s.abogadoAsignadoId === abogadoId)
}

// Helper para obtener solicitudes por juzgado
export function getSolicitudesByJuzgado(codigoDespacho: string): Solicitud[] {
  return mockSolicitudes.filter(s => s.codigoDespacho === codigoDespacho)
}

// Helper para generar nuevo ID de solicitud
export function generateSolicitudId(): string {
  const year = new Date().getFullYear()
  const count = mockSolicitudes.length + 1
  return `SOL-${year}-${count.toString().padStart(5, '0')}`
}

// Helper para generar radicado SIGOBIUS
export function generateRadicadoSIGOBIUS(): string {
  const year = new Date().getFullYear().toString().slice(-2)
  const count = mockSolicitudes.filter(s => s.radicadoSIGOBIUS).length + 1
  return `EXT-DESAJ-ME${year}-${count.toString().padStart(5, '0')}`
}

// Alertas
interface Alerta {
  id: string
  titulo: string
  descripcion: string
  tipo: 'CRÍTICA' | 'URGENTE' | 'ADVERTENCIA' | 'INFORMACIÓN'
  caso: string
  fecha: string
  leido: boolean
}

export const mockAlerts: Alerta[] = [
  {
    id: 'alr-001',
    titulo: 'Vencimiento de plazo crítico',
    descripcion: 'El plazo para el caso DESACATO-2024-001 vence en 3 días. Se requiere acción inmediata.',
    tipo: 'CRÍTICA',
    caso: 'DESACATO-2024-001',
    fecha: 'Hoy a las 10:30',
    leido: false
  },
  {
    id: 'alr-002',
    titulo: 'Documento requiere revisión',
    descripcion: 'El documento de mandamiento de pago para COSTAS-2024-015 necesita validación.',
    tipo: 'URGENTE',
    caso: 'COSTAS-2024-015',
    fecha: 'Hoy a las 09:15',
    leido: false
  },
  {
    id: 'alr-003',
    titulo: 'Nuevo caso asignado',
    descripcion: 'Se le ha asignado un nuevo caso DESACATO_FIDUPREVISORA-2024-042 con prioridad media.',
    tipo: 'INFORMACIÓN',
    caso: 'DESACATO_FIDUPREVISORA-2024-042',
    fecha: 'Ayer a las 14:45',
    leido: true
  },
  {
    id: 'alr-004',
    titulo: 'Próximo vencimiento de medidas cautelares',
    descripcion: 'Las medidas cautelares del caso NO_PENAL-2024-008 vencen en una semana.',
    tipo: 'ADVERTENCIA',
    caso: 'NO_PENAL-2024-008',
    fecha: 'Ayer a las 11:20',
    leido: false
  },
  {
    id: 'alr-005',
    titulo: 'Solicitud de información complementaria',
    descripcion: 'Se requiere información adicional del sancionado en DESACATO-2024-005.',
    tipo: 'URGENTE',
    caso: 'DESACATO-2024-005',
    fecha: 'Hace 2 días',
    leido: true
  },
  {
    id: 'alr-006',
    titulo: 'Caso finalizado exitosamente',
    descripcion: 'El caso COSTAS-2024-020 ha sido cerrado con cobro exitoso.',
    tipo: 'INFORMACIÓN',
    caso: 'COSTAS-2024-020',
    fecha: 'Hace 3 días',
    leido: true
  },
  {
    id: 'alr-007',
    titulo: 'Cambio de estado en solicitud',
    descripcion: 'La solicitud SOL-2024-00045 ha sido radicada en SIGOBIUS.',
    tipo: 'INFORMACIÓN',
    caso: 'SOL-2024-00045',
    fecha: 'Hace 4 días',
    leido: true
  },
  {
    id: 'alr-008',
    titulo: 'Pendiente de validación',
    descripcion: 'Solicitud SOL-2024-00048 requiere revisión y validación.',
    tipo: 'ADVERTENCIA',
    caso: 'SOL-2024-00048',
    fecha: 'Hace 1 día',
    leido: false
  }
]

// Usuarios para la página de usuarios
export const mockUsers = [
  ...mockUsuarios,
  {
    id: "abo-005",
    email: "sandra.castillo@desaj.gov.co",
    nombre: "Sandra Castillo",
    rol: "ABOGADO" as const,
    activo: true,
    especialidades: ["REINTEGRO"],
    capacidadMaxima: 18,
    disponibilidad: "DISPONIBLE" as const,
    casosActivos: 8,
    juzgado: "Juzgado 1 Civil"
  }
]

// Casos para reportes
export const mockCasos = mockSolicitudes.map((s, i) => ({
  id: s.id,
  numero: `CASO-${s.year}-${(i + 1).toString().padStart(5, '0')}`,
  estado: ['EN_PROCESO', 'ASIGNADA_A_ABOGADO', 'CERRADA', 'TERMINADA_SIN_PAGO'][
    Math.floor(Math.random() * 4)
  ] as any,
  monto: Math.random() > 0.3 ? 5000000 + Math.random() * 50000000 : 0,
  solicitante: s.solicitante,
  prioridad: ['ALTA', 'MEDIA', 'BAJA'][Math.floor(Math.random() * 3)] as any,
  year: s.year
}))

