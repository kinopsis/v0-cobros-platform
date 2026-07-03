"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn, Loader2, Shield, Mail, Lock, AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithCredentials, isLoading, isOffice365Enabled } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState("")

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Ingrese email y contrasena")
      return
    }

    setLoggingIn(true)
    const result = await loginWithCredentials(email, password)
    setLoggingIn(false)

    if (result.ok) {
      toast.success("Inicio de sesion exitoso")
      router.push("/dashboard")
    } else {
      setError(result.error || "Credenciales invalidas")
    }
  }

  const handleOffice365Login = async () => {
    setLoggingIn(true)
    login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          {/* Seccion Izquierda */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                Sistema de Cobro Coactivo
              </h1>
              <p className="text-lg text-muted-foreground">
                Plataforma de gestion integral de procesos de cobro coactivo
                para la Rama Judicial de Colombia
              </p>
            </div>

            <div className="space-y-4">
              <Feature title="Gestion Centralizada" desc="Administra todos tus casos desde una unica plataforma" />
              <Feature title="Trazabilidad Completa" desc="Seguimiento detallado de cada proceso y movimiento" />
              <Feature title="Reportes en Tiempo Real" desc="Indicadores y estadisticas actualizadas constantemente" />
            </div>

            <div className="bg-card border rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">ACCESO RESTRINGIDO</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Ingrese con las credenciales proporcionadas por su administrador.</p>
                <p>Si no tiene acceso, contacte al equipo de soporte técnico.</p>
              </div>
            </div>
          </div>

          {/* Seccion Derecha - Formulario */}
          <Card className="border-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Acceso al Sistema</CardTitle>
              <CardDescription>
                Ingrese con sus credenciales o use Office 365
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Formulario email/password */}
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo Electronico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loggingIn}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contrasena</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      disabled={loggingIn}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loggingIn || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {loggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Iniciando sesion...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Iniciar Sesion
                    </>
                  )}
                </Button>
              </form>

              {/* Boton Office 365 (solo si esta configurado) */}
              {isOffice365Enabled && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">o continuar con</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOffice365Login}
                    disabled={loggingIn || isLoading}
                    className="w-full"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="currentColor">
                      <path d="M10 0H0v10h10V0zM21 0H11v10h10V0zM10 11H0v10h10V11zM21 11H11v10h10V11z" fill="#0078D4"/>
                    </svg>
                    Iniciar sesion con Office 365
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>2026 Direccion Seccional de Administracion Judicial - Antioquia</p>
          <div className="flex gap-4 justify-center mt-3">
            <a href="#" className="hover:text-primary">Terminos de servicio</a>
            <a href="#" className="hover:text-primary">Politica de privacidad</a>
            <a href="#" className="hover:text-primary">Contacto</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary">
          &#10003;
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
