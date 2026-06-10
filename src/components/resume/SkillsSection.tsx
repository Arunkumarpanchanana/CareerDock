'use client'

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

  const addSkill = () => {
    const trimmed = input.trim()
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed])
    }
    setInput('')
  }

  const removeSkill = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add your technical and professional skills. Press Enter to add each skill.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type a skill and press Enter"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={addSkill}
          className="rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>

      {items.length > 0 && (
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
      )}

      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No skills added yet.</p>
      )}
    </div>
  )
}
