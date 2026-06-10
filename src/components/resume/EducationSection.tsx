'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import type { Education } from '@/types/database'

export function EducationSection({
  items,
  onChange,
}: {
  items: Education[]
  onChange: (items: Education[]) => void
}) {
  const addItem = () => {
    onChange([...items, { institution: '', degree: '', field: '', year: '' }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Education, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Education</h2>
          <p className="text-sm text-gray-500 mt-1">Add your academic background.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Education
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No education added yet.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Entry {index + 1}</span>
            <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Institution"
              value={item.institution}
              onChange={(e) => updateItem(index, 'institution', e.target.value)}
            />
            <Input
              placeholder="Degree"
              value={item.degree}
              onChange={(e) => updateItem(index, 'degree', e.target.value)}
            />
            <Input
              placeholder="Field of Study"
              value={item.field}
              onChange={(e) => updateItem(index, 'field', e.target.value)}
            />
            <Input
              placeholder="Year"
              value={item.year}
              onChange={(e) => updateItem(index, 'year', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
