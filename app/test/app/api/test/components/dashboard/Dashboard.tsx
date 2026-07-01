'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  priority: string
  due_date: string
}

interface ContentPlatform {
  id: string
  platform: string
  scheduled_for: string
}

interface Notification {
  id: string
  title: string
  type: string
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [content, setContent] = useState<ContentPlatform[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Get today's date
        const today = new Date().toISOString().split('T')[0]

        // Fetch tasks for today
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, priority, due_date')
          .eq('status', 'todo')
          .gte('due_date', today)
          .lte('due_date', `${today}T23:59:59`)
          .order('priority', { ascending: false })

        if (tasksError) throw tasksError

        // Fetch content scheduled for today
        const { data: contentData, error: contentError } = await supabase
          .from('content_platforms')
          .select('id, platform, scheduled_for')
          .gte('scheduled_for', today)
          .lte('scheduled_for', `${today}T23:59:59`)

        if (contentError) throw contentError

        // Fetch unread notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('id, title, type')
          .eq('is_read', false)
          .limit(5)
          .order('created_at', { ascending: false })

        if (notificationsError) throw notificationsError

        setTasks(tasksData || [])
        setContent(contentData || [])
        setNotifications(notificationsData || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center">Cargando dashboard...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">¿Qué debo hacer hoy?</h1>
      <p className="text-gray-600 mb-8">{new Date().toLocaleDateString('es-AR')}</p>

      {error && <div className="bg-red-50 p-4 rounded mb-8 text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Tareas Pendientes
          </h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No hay tareas para hoy</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-600">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-gray-600 mt-1">Prioridad: {task.priority}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Content to Publish */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Publicaciones Hoy
          </h2>
          {content.length === 0 ? (
            <p className="text-gray-500">No hay publicaciones programadas</p>
          ) : (
            <ul className="space-y-3">
              {content.map((item) => (
                <li key={item.id} className="p-3 bg-green-50 rounded border-l-4 border-green-600">
                  <p className="font-medium text-sm capitalize">{item.platform}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(item.scheduled_for).toLocaleTimeString('es-AR')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Notificaciones
          </h2>
          {notifications.length === 0 ? (
            <p className="text-gray-500">Sin notificaciones pendientes</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notif) => (
                <li key={notif.id} className="p-3 bg-orange-50 rounded border-l-4 border-orange-600">
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{notif.type}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Resumen del Día</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-3xl font-bold text-blue-600">{tasks.length}</p>
            <p className="text-gray-600 text-sm">Tareas</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{content.length}</p>
            <p className="text-gray-600 text-sm">Publicaciones</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-orange-600">{notifications.length}</p>
            <p className="text-gray-600 text-sm">Notificaciones</p>
          </div>
        </div>
      </div>
    </div>
  )
}
