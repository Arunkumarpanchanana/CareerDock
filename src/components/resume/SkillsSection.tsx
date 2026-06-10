'use client'

import { SUGGESTED_SKILLS } from '@/lib/suggestions'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'
import { useState } from 'react'

export function SkillsSection({
  items,
  onChange,
}: {
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [input, setInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('Frontend')

  const addSkill = (skill: string) => {
    if (skill && !items.includes(skill)) {
      onChange([...items, skill])
    }
    setInput('')
  }

  const removeSkill = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill(input.trim())
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add your skills. Pick from suggestions below or type your own.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type a custom skill and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={() => addSkill(input.trim())}
          className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>

      {items.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Your Skills</p>
          <div className="flex flex-wrap gap-2">
            {items.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
              >
                {skill}
                <button onClick={() => removeSkill(index)} className="hover:text-blue-900">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Suggested Skills</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.keys(SUGGESTED_SKILLS).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SKILLS[activeCategory].map((skill) => {
            const selected = items.includes(skill)
            return (
              <button
                key={skill}
                onClick={() => (selected ? removeSkill(items.indexOf(skill)) : addSkill(skill))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  selected
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {skill}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
