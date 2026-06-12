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

  const updateItem = (index: number, field: keyof Education, value: string | string[]) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    onChange(updated)
  }

  const addCoursework = (index: number) => {
    const updated = items.map((item, i) =>
      i === index
        ? { ...item, relevant_coursework: [...(item.relevant_coursework ?? []), ''] }
        : item
    )
    onChange(updated)
  }

  const updateCoursework = (itemIndex: number, courseIndex: number, value: string) => {
    const updated = items.map((item, i) => {
      if (i !== itemIndex) return item
      const coursework = [...(item.relevant_coursework ?? [])]
      coursework[courseIndex] = value
      return { ...item, relevant_coursework: coursework }
    })
    onChange(updated)
  }

  const removeCoursework = (itemIndex: number, courseIndex: number) => {
    const updated = items.map((item, i) => {
      if (i !== itemIndex) return item
      const coursework = (item.relevant_coursework ?? []).filter((_, j) => j !== courseIndex)
      return { ...item, relevant_coursework: coursework }
    })
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
            <Input
              placeholder="GPA (optional, e.g. 3.8/4.0)"
              value={item.gpa ?? ''}
              onChange={(e) => updateItem(index, 'gpa', e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">Relevant Coursework</label>
              <button
                onClick={() => addCoursework(index)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add course
              </button>
            </div>
            {(item.relevant_coursework ?? []).length > 0 && (
              <div className="space-y-1">
                {(item.relevant_coursework ?? []).map((course, ci) => (
                  <div key={ci} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Course name"
                      value={course}
                      onChange={(e) => updateCoursework(index, ci, e.target.value)}
                    />
                    <button onClick={() => removeCoursework(index, ci)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5 mt-1.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
