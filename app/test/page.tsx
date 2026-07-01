'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface TestResult {
  name: string
  status: 'loading' | 'success' | 'error'
  data?: any
  error?: string
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Workspaces', status: 'loading' },
    { name: 'Users', status: 'loading' },
    { name: 'Clients', status: 'loading' },
  ])

  useEffect(() => {
    const runTests = async () => {
      const newResults: TestResult[] = []

      try {
        const { data, error } = await supabase.from('workspaces').select('*')
        if (error) throw error
        newResults.push({
          name: 'Workspaces',
          status: 'success',
          data,
        })
      } catch (error: any) {
        newResults.push({
          name: 'Workspaces',
          status: 'error',
          error: error.message,
        })
      }

      try {
        const { data, error } = await supabase.from('users').select('*')
        if (error) throw error
        newResults.push({
          name: 'Users',
          status: 'success',
          data,
        })
      } catch (error: any) {
        newResults.push({
          name: 'Users',
          status: 'error',
          error: error.message,
        })
      }

      try {
        const { data, error } = await supabase.from('clients').select('*')
        if (error) throw error
        newResults.push({
          name: 'Clients',
          status: 'success',
          data,
        })
      } catch (error: any) {
        newResults.push({
          name: 'Clients',
          status: 'error',
          error: error.message,
        })
      }

      setResults(newResults)
    }

    runTests()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🧪 System Validation Tests</h1>

      <div className="space-y-6">
        {results.map((result) => (
          <div
            key={result.name}
            className={`p-6 rounded-lg border-2 ${
              result.status === 'success'
                ? 'border-green-500 bg-green-50'
                : result.status === 'error'
                  ? 'border-red-500 bg-red-50'
                  : 'border-blue-500 bg-blue-50'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              {result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏳'}
              {result.name}
            </h2>

            {result.status === 'loading' && (
              <p className="text-gray-600">Testing...</p>
            )}

            {result.status === 'error' && (
              <p className="text-red-700 font-mono text-sm">{result.error}</p>
            )}

            {result.status === 'success' && (
              <pre className="bg-white p-4 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
