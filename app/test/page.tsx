'use client'

import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        
        <Card>
          <h3 className="text-xl font-bold mb-4">⚠️ Pendiente de Aprobación</h3>
          <p className="text-gray-600">No hay contenido esperando aprobación</p>
        </Card>

        <Card className="mt-4">
          <h3 className="text-xl font-bold mb-4">📅 Publicaciones Hoy</h3>
          <p className="text-gray-600">No hay publicaciones programadas</p>
        </Card>
      </div>
    </Layout>
  )
}
