-- ============================================================
-- Índices de rendimiento para la plataforma de cobro coactivo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Índice para filtrar solicitudes por correo institucional (usado por rol JUZGADO)
CREATE INDEX IF NOT EXISTS idx_solicitudes_correo_institucional 
ON solicitudes(correo_institucional);

-- Índice compuesto para filtrar por estado + correo (dashboard y listados)
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado_correo 
ON solicitudes(estado, correo_institucional);

-- Índice para ordenar notificaciones por usuario + fecha
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_fecha 
ON notificaciones(usuario_id, fecha_creacion DESC);

-- Índice para búsqueda de documentos por solicitud
CREATE INDEX IF NOT EXISTS idx_documentos_adjuntos_solicitud 
ON documentos_adjuntos(solicitud_id);
