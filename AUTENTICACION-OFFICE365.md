# Autenticacion Office 365 (multi-tenant, patron vTiger)

Esta guia explica como habilitar el boton **"Iniciar sesion con Office 365"** en el login.
El acceso se concede **solo si el email del usuario existe en la tabla `usuarios` de Supabase**
(cruce por BD, igual que hace vTiger). No se requiere que cada despliegue configure su propio
tenant de Azure AD: se usa **una sola app registration multi-tenant tuya**.

## Como funciona el flujo

```
[Boton "Iniciar sesion con Office 365"]
  -> redirect a Microsoft /authorize (client_id=TUYO, tenant=organizations)
  -> el usuario se loguea con SU cuenta Office 365
  -> Microsoft devuelve id_token a /api/auth/callback/azure-ad
  -> Auth.js valida el token
  -> callback jwt busca en Supabase:
       SELECT * FROM usuarios WHERE azure_oid = ? OR email = ?
     - existe y activo  -> crea sesion (JWT 30 min) -> /dashboard
     - existe e inactivo -> bloqueado
     - no existe         -> bloqueado (a menos que AUTH_AZURE_AD_AUTO_CREATE=true)
```

Microsoft actua como Identity Provider; la tabla `usuarios` es la fuente de verdad para
autorizacion. No se guarda la contrasena del usuario en ningun lado.

## Paso 1 — Registrar la app multi-tenant en Entra ID (una sola vez)

1. Entra a **https://entra.microsoft.com** (o https://portal.azure.com → App registrations).
2. **New registration**.
3. Completa:
   - **Name**: `Cobros Coactivo SSO` (nombre que veran los usuarios en el consent).
   - **Supported account types**: **Accounts in any organizational directory (Any Azure AD directory - Multitenant)**.
     - Si tambien quieres cuentas personales (outlook.com, xbox), usa la 4ª opcion.
   - **Redirect URI** → plataforma **Web** →
     `http://localhost:3000/api/auth/callback/azure-ad` (dev) y
     `https://TU-DOMINIO-PROD/api/auth/callback/azure-ad` (prod).
4. **Register**. Anota el **Application (client) ID** (= `AUTH_AZURE_AD_ID`).
5. **Certificates & secrets** → **New client secret** → descripcion `secret-prod`,
   expiracion 12-24 meses → **Add**. ⚠️ Copia el **Value** ahora (no se vuelve a mostrar)
   (= `AUTH_AZURE_AD_SECRET`).
6. **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   → marcar `openid`, `profile`, `email`, `User.Read` → **Add permissions**.
7. (Opcional) **Branding & properties**: sube logo, homepage, URLs de terminos/privacidad.
   Aparece en la pantalla de consent de Microsoft.
8. (Opcional, recomendado) **Grant admin consent** para tu propio tenant.

> Nota: para que usuarios de **otros** tenants no vean la pantalla de consent cada vez,
> un admin de ese tenant debe aceptar una sola vez en:
> `https://login.microsoftonline.com/{su-tenant-id}/adminconsent?client_id={AUTH_AZURE_AD_ID}`

## Paso 2 — Configurar variables de entorno

Edita `.env.local` (o el entorno correspondiente):

```env
# Requerido
AUTH_AZURE_AD_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AUTH_AZURE_AD_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opcional — default "organizations" (cualquier cuenta work/school de Office 365)
# Alternativas: "common" (work/school + personales) | tenant-id-especifico (single-tenant)
AUTH_AZURE_AD_TENANT_ID=organizations

# Opcional — dominios permitidos (comma-separated).
# Vacio = permitir todos y delegar el control al cruce con la tabla usuarios.
AUTH_AZURE_AD_DOMAIN=cendoj.ramajudicial.gov.co

# Opcional — auto-crear usuario en BD si no existe y el dominio esta permitido.
# false (default) = solo entran usuarios YA registrados (patron vTiger estricto).
AUTH_AZURE_AD_AUTO_CREATE=false

# Publico — mostrar el boton de Office 365 en el login.
NEXT_PUBLIC_AZURE_AD_ENABLED=true
```

Reinicia el servidor: `npm run dev`.

## Paso 3 — Registrar usuarios en Supabase

El cruce se hace por `email` y/o `azure_oid` en la tabla `usuarios`. Opciones:

- **Manual**: inserta filas en Supabase con el `email` corporativo del usuario, `rol`,
  `activo=true`. El `azure_oid` se completa automaticamente en el primer login exitoso.
- **Auto-create** (opcional): si seteas `AUTH_AZURE_AD_AUTO_CREATE=true` y el dominio esta
  permitido, el primer login crea el usuario con rol `JUZGADO`. No recomendado para produccion
  estricta.

Columnas usadas de `usuarios`: `id, email, nombre, rol, activo, azure_oid, ultimo_acceso`.

## Comportamiento por configuracion

| Escenario | Resultado |
|---|---|
| `NEXT_PUBLIC_AZURE_AD_ENABLED=false` | Boton oculto. Solo login por credenciales. |
| Usuario en BD, activo | Entra al dashboard. |
| Usuario en BD, inactivo | Bloqueado. |
| Usuario NO en BD, `AUTO_CREATE=false` | Bloqueado (no se crea cuenta). |
| Usuario NO en BD, `AUTO_CREATE=true`, dominio permitido | Se crea con rol `JUZGADO` y entra. |
| Email de dominio no permitido (`AUTH_AZURE_AD_DOMAIN` seteado) | Rechazado antes del cruce. |
| `AUTH_AZURE_AD_DOMAIN` vacio | Cualquier dominio; el cruce por BD es la unica barrera. |

## Seguridad

- El `client_secret` **nunca** se expone al frontend; el intercambio code→token lo hace
  Auth.js en el servidor.
- La sesion es JWT de 30 min (`session: { strategy: "jwt", maxAge: 30 * 60 }`).
- `middleware.ts` protege todas las rutas no publicas y aplica RBAC por `session.user.rol`.
- Para produccion, considera usar un **certificado** en vez de un client secret, y rotar el
  secret antes de su expiracion.

## Troubleshooting

- **El boton no aparece**: verifica `NEXT_PUBLIC_AZURE_AD_ENABLED=true` y reinicia el dev server.
- **Error `redirect_uri_mismatch`**: el Redirect URI en Azure debe coincidir exactamente con
  `{NEXT_PUBLIC_APP_URL}/api/auth/callback/azure-ad` (incluido https y sin trailing slash).
- **Usuario valido en Office 365 pero rechazado**: no existe en `usuarios` o `activo=false`.
  Inserta/activa el registro en Supabase.
- **Pantalla de consent cada login**: falta admin consent en el tenant del usuario.
- **`AADSTS700016` Application not found**: `AUTH_AZURE_AD_ID` incorrecto.
- **`AADSTS7000212` Invalid client secret**: `AUTH_AZURE_AD_SECRET` incorrecto o expirado.

## Referencia tecnica

- Provider: `@auth/core/providers/azure-ad` (Auth.js v5).
- Configuracion del provider y callbacks: `lib/auth.ts`.
- Contexto de auth (flag `isOffice365Enabled`): `lib/auth-context.tsx`.
- UI del login: `app/login/page.tsx`.
- Middleware de proteccion: `middleware.ts`.
