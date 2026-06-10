'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import type { Certificate } from '@/types/database'

export function CertificatesSection({
  items,
  onChange,
}: {
  items: Certificate[]
  onChange: (items: Certificate[]) => void
}) {
  const addItem = () => {
    onChange([...items, { name: '', issuer: '', date: '', url: '' }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Certificate, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
          <p className="text-sm text-gray-500 mt-1">Add relevant certifications.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Certificate
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No certificates added yet.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Certificate {index + 1}</span>
            <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Input
            placeholder="Certificate Name"
            value={item.name}
            onChange={(e) => updateItem(index, 'name', e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              placeholder="Issuer"
              value={item.issuer}
              onChange={(e) => updateItem(index, 'issuer', e.target.value)}
            />
            <Input
              placeholder="Date"
              value={item.date}
              onChange={(e) => updateItem(index, 'date', e.target.value)}
            />
            <Input
              placeholder="URL (optional)"
              value={item.url}
              onChange={(e) => updateItem(index, 'url', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
