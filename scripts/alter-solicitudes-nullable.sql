-- Simplificacion del formulario /solicitudes/nueva
-- Columnas que ya no seran enviadas desde el frontend
-- Se hacen nullable para evitar errores de inserción

ALTER TABLE public.solicitudes ALTER COLUMN funcionario_remitente DROP NOT NULL;
ALTER TABLE public.solicitudes ALTER COLUMN correo_institucional DROP NOT NULL;
