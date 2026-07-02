-- Agregar nuevas columnas para el CSV de 10 columnas
-- 0017_Tabla principal_10col.csv

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS especialidad_area text;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS corporacion text;

-- Índices para mejorar rendimiento de los nuevos filtros
CREATE INDEX IF NOT EXISTS idx_usuarios_especialidad_area ON usuarios(especialidad_area);
CREATE INDEX IF NOT EXISTS idx_usuarios_ciudad ON usuarios(ciudad);
