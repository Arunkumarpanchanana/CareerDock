'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import type { Project } from '@/types/database'

export function ProjectsSection({
  items,
  onChange,
}: {
  items: Project[]
  onChange: (items: Project[]) => void
}) {
  const addItem = () => {
    onChange([...items, { name: '', description: '', tech_stack: '', url: '' }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Project, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Showcase your key projects.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Project
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No projects added yet.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Project {index + 1}</span>
            <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Input
            placeholder="Project Name"
            value={item.name}
            onChange={(e) => updateItem(index, 'name', e.target.value)}
          />
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            placeholder="Brief description of the project"
            value={item.description}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Tech Stack (e.g. React, Node.js)"
              value={item.tech_stack}
              onChange={(e) => updateItem(index, 'tech_stack', e.target.value)}
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
