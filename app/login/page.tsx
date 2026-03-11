'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Lock, Mail, LogIn } from 'lucide-react'

const demoAccounts = [
  { email: 'juzgado@judicial.gov.co', password: 'demo123', role: 'juzgado', name: 'Juzgado Admin' },
  { email: 'gestor@judicial.gov.co', password: 'demo123', role: 'gestor', name: 'Gestor de Cobro' },
  { email: 'abogado@judicial.gov.co', password: 'demo123', role: 'abogado', name: 'Abogado' },
  { email: 'admin@judicial.gov.co', password: 'demo123', role: 'admin', name: 'Administrador' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    
    // Simular verificación
    setTimeout(() => {
      const account = demoAccounts.find(acc => acc.email === email && acc.password === password)
      
      if (account) {
        login({
          id: account.email,
          name: account.name,
          email: account.email,
          role: account.role as any,
        })
        toast.success(`¡Bienvenido ${account.name}!`)
        router.push('/dashboard')
      } else {
        toast.error('Credenciales inválidas. Intenta con las cuentas de demostración.')
      }
      setLoading(false)
    }, 1000)
  }

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setEmail(account.email)
    setPassword(account.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          {/* Sección Izquierda */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                Sistema de Cobro Coactivo
              </h1>
              <p className="text-lg text-muted-foreground">
                Plataforma de gestión integral de procesos de cobro coactivo para la Rama Judicial de Colombia
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20 text-primary">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Gestión Centralizada</h3>
                  <p className="text-xs text-muted-foreground">Administra todos tus casos desde una única plataforma</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/20 text-accent">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Trazabilidad Completa</h3>
                  <p className="text-xs text-muted-foreground">Seguimiento detallado de cada proceso y movimiento</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-500/20 text-green-600">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Reportes en Tiempo Real</h3>
                  <p className="text-xs text-muted-foreground">Indicadores y estadísticas actualizadas constantemente</p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">CUENTAS DE DEMOSTRACIÓN</p>
              <div className="space-y-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    onClick={() => handleDemoLogin(account)}
                    className="w-full text-left p-2 rounded-lg hover:bg-secondary transition-colors text-sm border"
                  >
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sección Derecha - Formulario */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Iniciar Sesión
              </CardTitle>
              <CardDescription>Ingresa con tus credenciales de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <input type="checkbox" id="remember" className="h-4 w-4 rounded border" />
                  <label htmlFor="remember" className="text-muted-foreground">
                    Recuérdame
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                  </div>
                </div>

                <Button type="button" variant="outline" className="w-full">
                  Single Sign-On (SSO) - SIGOBIUS
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">¿Problemas para acceder?</p>
                  <a href="#" className="text-sm font-medium text-primary hover:underline">
                    Recuperar contraseña
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          <p>© 2024 Dirección Seccional de Administración Judicial - Antioquia. Todos los derechos reservados.</p>
          <div className="flex gap-4 justify-center mt-3">
            <a href="#" className="hover:text-primary">Términos de servicio</a>
            <a href="#" className="hover:text-primary">Política de privacidad</a>
            <a href="#" className="hover:text-primary">Contacto</a>
          </div>
        </div>
      </div>
    </div>
  )
}
