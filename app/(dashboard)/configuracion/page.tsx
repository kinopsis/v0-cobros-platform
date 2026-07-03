'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Settings, Database, Lock, Mail, Users } from 'lucide-react'

export default function ConfiguracionPage() {
  const [nombreEntidad, setNombreEntidad] = useState('Dirección Seccional de Administración Judicial - Antioquia')
  const [emailContacto, setEmailContacto] = useState('contacto@desaj-antioquia.gov.co')
  const [telefonoContacto, setTelefonoContacto] = useState('+57 4 xxx-xxxx')
  const [direccion, setDireccion] = useState('Carrera 50 #54-20, Medellín, Colombia')

  const handleGuardar = (seccion: string) => {
    toast.success(`${seccion} guardado correctamente`)
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-2">Administra los parámetros y configuraciones generales de la plataforma</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="-mx-1 px-1 pb-1">
        <TabsList className="grid w-full grid-cols-4 min-w-0">