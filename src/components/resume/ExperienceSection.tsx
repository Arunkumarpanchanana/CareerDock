'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { SUGGESTED_BULLETS } from '@/lib/suggestions'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Experience } from '@/types/database'

const BULLET_CATEGORIES = [
  { key: 'general', label: 'General' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'fullstack', label: 'Full Stack' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'management', label: 'Management' },
  { key: 'strategy', label: 'Strategy' },
]

export function ExperienceSection({
  items,
  onChange,
}: {
  items: Experience[]
  onChange: (items: Experience[]) => void
}) {
  const [showSuggestions, setShowSuggestions] = useState<number | null>(null)

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

  const addBullet = (itemIndex: number, text = '') => {
    const updated = items.map((item, i) =>
      i === itemIndex ? { ...item, bullets: [...item.bullets, text] } : item
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
    <div className="space-y-6 max-w-3xl">
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
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-400 italic">No experience added yet.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add Your First Position
          </Button>
        </div>
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
              placeholder="Company name"
              value={item.company}
              onChange={(e) => updateItem(index, 'company', e.target.value)}
            />
            <Input
              placeholder="Job title"
              value={item.role}
              onChange={(e) => updateItem(index, 'role', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Start date (e.g. Jan 2023)"
              value={item.start_date}
              onChange={(e) => updateItem(index, 'start_date', e.target.value)}
            />
            <Input
              type="text"
              placeholder="End date (or Present)"
              value={item.end_date ?? ''}
              onChange={(e) => updateItem(index, 'end_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Bullet Points</label>
              <button
                onClick={() => setShowSuggestions(showSuggestions === index ? null : index)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Sparkles className="h-3 w-3" />
                Suggestions
              </button>
            </div>

            {showSuggestions === index && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                <p className="text-xs font-medium text-blue-700">Click a suggestion to add it:</p>
                <div className="flex flex-wrap gap-1.5">
                  {BULLET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        const bullets = SUGGESTED_BULLETS[cat.key]
                        const updated = items.map((item, i) =>
                          i === index
                            ? { ...item, bullets: [...item.bullets, ...bullets] }
                            : item
                        )
                        onChange(updated)
                      }}
                      className="px-2 py-1 rounded text-xs font-medium bg-white border border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      + {cat.label}
                    </button>
                  ))}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                  {BULLET_CATEGORIES.flatMap((cat) =>
                    SUGGESTED_BULLETS[cat.key].map((bullet, bi) => {
                      const alreadyAdded = item.bullets.includes(bullet)
                      return (
                        <button
                          key={`${cat.key}-${bi}`}
                          onClick={() => {
                            if (!alreadyAdded) addBullet(index, bullet)
                          }}
                          disabled={alreadyAdded}
                          className={`block w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                            alreadyAdded
                              ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-blue-100 cursor-pointer'
                          }`}
                        >
                          {bullet}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

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
