'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2 } from 'lucide-react'
import type { Experience } from '@/types/database'

export function ExperienceSection({
  items,
  onChange,
}: {
  items: Experience[]
  onChange: (items: Experience[]) => void
}) {
  const addItem = () => {
    onChange([...items, { company: '', role: '', start_date: '', end_date: '', bullets: [''] }])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof Experience, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
    const updated = items.map((item, i) => {
      if (i !== itemIndex) return item
      const bullets = item.bullets.map((b, j) => (j === bulletIndex ? value : b))
      return { ...item, bullets }
    })
    onChange(updated)
  }

  const addBullet = (itemIndex: number) => {
    const updated = items.map((item, i) =>
      i === itemIndex ? { ...item, bullets: [...item.bullets, ''] } : item
    )
    onChange(updated)
  }

  const removeBullet = (itemIndex: number, bulletIndex: number) => {
    const updated = items.map((item, i) =>
      i === itemIndex
        ? { ...item, bullets: item.bullets.filter((_, j) => j !== bulletIndex) }
        : item
    )
    onChange(updated)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Work Experience</h2>
          <p className="text-sm text-gray-500 mt-1">Add your relevant work history.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" /> Add Experience
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No experience added yet.</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Position {index + 1}</span>
            <button
              onClick={() => removeItem(index)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Company"
              value={item.company}
              onChange={(e) => updateItem(index, 'company', e.target.value)}
            />
            <Input
              placeholder="Role"
              value={item.role}
              onChange={(e) => updateItem(index, 'role', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Start Date (e.g. Jan 2023)"
              value={item.start_date}
              onChange={(e) => updateItem(index, 'start_date', e.target.value)}
            />
            <Input
              type="text"
              placeholder="End Date (or Present)"
              value={item.end_date ?? ''}
              onChange={(e) => updateItem(index, 'end_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bullet Points</label>
            {item.bullets.map((bullet, bIndex) => (
              <div key={bIndex} className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe an achievement or responsibility"
                  value={bullet}
                  onChange={(e) => updateBullet(index, bIndex, e.target.value)}
                />
                {item.bullets.length > 1 && (
                  <button
                    onClick={() => removeBullet(index, bIndex)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mt-2.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => addBullet(index)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add bullet point
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
