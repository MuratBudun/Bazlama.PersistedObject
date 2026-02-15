import { useState, useEffect, useCallback } from 'react'
import { DynamicModel } from '../types'

export function useModels() {
  const [models, setModels] = useState<DynamicModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/models')
      if (!res.ok) throw new Error('Failed to fetch models')
      const data = await res.json()
      setModels(data)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const registerModel = useCallback(async (model: {
    name: string
    table_name: string
    description: string
    fields: any[]
  }) => {
    const res = await fetch('/api/models/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to register model' }))
      throw new Error(err.detail || 'Failed to register model')
    }
    const result = await res.json()
    await fetchModels()
    return result
  }, [fetchModels])

  const deleteModel = useCallback(async (name: string) => {
    const res = await fetch(`/api/models/${name}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete model' }))
      throw new Error(err.detail || 'Failed to delete model')
    }
    await fetchModels()
  }, [fetchModels])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return { models, loading, error, fetchModels, registerModel, deleteModel }
}
