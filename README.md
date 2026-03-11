# Sistema de Gestión de Cobro Coactivo - DESAJ Antioquia

Plataforma web centralizada para la gestión integral de procesos de cobro coactivo de la Dirección Seccional de Administración Judicial de Antioquia (DESAJ).

## 🎯 Descripción

Este sistema proporciona una solución completa para la gestión de cobros coactivos, permitiendo que jueces, gestores, abogados y administradores colaboren en la resolución eficiente de casos.

## 📋 Características Principales

### Portal Juzgado
- Radicación de nuevas solicitudes de cobro coactivo
- Seguimiento de solicitudes radicadas
- Visualización detallada de casos
- Centro de notificaciones

### Portal Gestor
- Bandeja centralizada de casos en gestión
- Asignación de casos a abogados
- Gestión de cartera de profesionales
- Análisis de productividad

### Portal Abogado
- Bandeja personal de casos asignados
- Gestión de casos en proceso
- Historial de casos cerrados
- Sistema de alertas

### Portal Administrador
- Dashboard ejecutivo con KPIs
- Reportes y análisis con visualizaciones
- Gestión de usuarios del sistema
- Auditoría y trazabilidad completa
- Estadísticas por juzgado y periodo

## 🚀 Cuentas de Demostración

El sistema incluye cuentas de demostración para cada rol:

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Juzgado | juzgado@judicial.gov.co | demo123 |
| Gestor | gestor@judicial.gov.co | demo123 |
| Abogado | abogado@judicial.gov.co | demo123 |
| Administrador | admin@judicial.gov.co | demo123 |

## 📂 Estructura de Carpetas

```
app/
├── (dashboard)/                 # Rutas protegidas
│   ├── dashboard/              # Dashboard principal
│   ├── solicitudes/            # Portal Juzgado
│   ├── gestion/                # Portal Gestor
│   ├── casos/                  # Portal Abogado
│   ├── abogados/               # Gestión de abogados
│   ├── usuarios/               # Gestión de usuarios (Admin)
│   ├── reportes/               # Reportes (Admin)
│   ├── estadisticas/           # Estadísticas (Admin)
│   ├── auditoria/              # Auditoría (Admin)
│   ├── notificaciones/         # Centro de notificaciones
│   ├── alertas/                # Alertas del sistema (Abogado)
│   ├── trazabilidad/           # Historial y trazabilidad
│   ├── configuracion/          # Configuración del sistema
│   └── perfil/                 # Perfil de usuario
├── login/                      # Página de autenticación
└── page.tsx                    # Página de inicio (redirige)

components/
├── dashboards/                 # Dashboards específicos por rol
├── solicitudes/                # Componentes para solicitudes
├── app-sidebar.tsx             # Barra lateral principal
├── notification-center.tsx     # Centro de notificaciones
├── user-menu.tsx               # Menú de usuario
└── ui/                         # Componentes UI reutilizables

lib/
├── auth-context.tsx            # Contexto de autenticación
├── types.ts                    # Tipos de datos del sistema
└── mock-data.ts                # Datos de prueba

public/
└── [assets]                    # Imágenes y recursos

styles/
└── globals.css                 # Estilos globales
```

## 🎨 Diseño Visual

### Paleta de Colores
- **Primario**: Azul institucional (#1e3a5f)
- **Secundario**: Gris neutro profesional (#f5f7fa)
- **Acentos**: Dorado institucional (#d4a574)
- **Estados**: Verde (éxito), Rojo (error), Naranja (advertencia), Azul (información)

### Tipografía
- **Headings**: Inter
- **Body**: Source Sans 3

## 📱 Páginas Disponibles

### Autenticación
- `/login` - Página de login

### Dashboards
- `/dashboard` - Dashboard principal (adaptado por rol)

### Portal Juzgado
- `/solicitudes/nueva` - Crear nueva solicitud
- `/solicitudes` - Listado de solicitudes
- `/solicitudes/[id]` - Detalle de solicitud

### Portal Gestor
- `/gestion` - Bandeja de gestión
- `/gestion/[id]` - Detalle de gestión
- `/abogados` - Gestión de abogados

### Portal Abogado
- `/casos` - Listado de casos
- `/casos/[id]` - Detalle del caso
- `/casos/proceso` - Casos en proceso
- `/casos/cerrados` - Casos cerrados
- `/alertas` - Alertas del sistema

### Portal Administrador
- `/usuarios` - Gestión de usuarios
- `/reportes` - Reportes
- `/estadisticas` - Estadísticas
- `/auditoria` - Auditoría

### Funcionalidades Comunes
- `/notificaciones` - Centro de notificaciones
- `/trazabilidad` - Historial y trazabilidad
- `/configuracion` - Configuración del sistema
- `/perfil` - Perfil de usuario

## 🔐 Seguridad

El sistema implementa:
- Autenticación basada en contexto React
- Control de acceso por roles (RBAC)
- Auditoría completa de todas las acciones
- Validación de formularios
- Protección de rutas

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 15
- **UI Components**: shadcn/ui
- **Estilos**: Tailwind CSS v4
- **Autenticación**: Context API
- **Notificaciones**: Sonner
- **Iconos**: Lucide React
- **Gráficos**: Recharts

## 📊 Estados de Solicitud/Caso

- RECIBIDA - Solicitud inicial
- EN_VALIDACION - Proceso de validación
- DEVUELTA - Solicitud devuelta para correcciones
- RADICADA_EN_SIGOBIUS - Radicada en el sistema judicial
- ASIGNADA_A_ABOGADO - Asignada a profesional
- EN_PROCESO - En gestión activa
- MANDAMIENTO_DE_PAGO - Mandamiento emitido
- MEDIDAS_CAUTELARES - Medidas cautelares aplicadas
- RADICADO_SISTEMA_JUSTICIA - Radicado en juzgado
- CERRADA - Caso finalizado con cobro
- TERMINADA_SIN_PAGO - Finalizado sin cobro

## 🎯 Flujo de Procesos

### Flujo Juzgado → Gestor → Abogado

1. **Juzgado**: Radica nueva solicitud
2. **Sistema**: Valida información
3. **Gestor**: Revisa y asigna a abogado
4. **Abogado**: Gestiona caso y actualiza estado
5. **Sistema**: Registra todas las acciones
6. **Admin**: Analiza reportes y métricas

## 📈 Métricas Disponibles

- Cantidad de casos por estado
- Recaudación total
- Tasa de éxito de cobros
- Productividad por abogado
- Tiempo promedio de resolución
- Casos por juzgado
- Distribución por clase de proceso

## 🔄 Estados de Disponibilidad (Abogados)

- DISPONIBLE - Aceptan nuevos casos
- MEDIA - Capacidad limitada
- NO_DISPONIBLE - No aceptan asignaciones

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al área de tecnología de DESAJ Antioquia.

## 📄 Licencia

Sistema desarrollado para la Rama Judicial de Colombia - Antioquia.
