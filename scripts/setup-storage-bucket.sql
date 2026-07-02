-- ============================================================
-- Configuración de Supabase Storage para documentos de solicitudes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear bucket para documentos de solicitudes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('solicitudes-docs', 'solicitudes-docs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas RLS para el bucket

-- Permitir INSERT para usuarios autenticados (subir documentos)
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir documentos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'solicitudes-docs');

-- Permitir SELECT para usuarios autenticados (leer/descargar documentos)
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden ver documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'solicitudes-docs');

-- 3. Asegurar que la tabla documentos_adjuntos existe
CREATE TABLE IF NOT EXISTS documentos_adjuntos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'application/pdf',
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  es_obligatorio BOOLEAN DEFAULT true,
  fecha_carga TIMESTAMPTZ DEFAULT now()
);

-- 4. Índice para búsquedas por solicitud
CREATE INDEX IF NOT EXISTS idx_documentos_adjuntos_solicitud ON documentos_adjuntos(solicitud_id);
