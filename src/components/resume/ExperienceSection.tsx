'use client'

import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { SUGGESTED_BULLETS } from '@/lib/suggestions'
import { Loader2, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react'
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
  const [aiGenerating, setAiGenerating] = useState<number | null>(null)
  const [aiContext, setAiContext] = useState('')
  const [showAiInput, setShowAiInput] = useState<number | null>(null)
  const [aiResults, setAiResults] = useState<string[] | null>(null)
  const [rewritingBullet, setRewritingBullet] = useState<{ item: number; bullet: number } | null>(null)
  const [rewriteResults, setRewriteResults] = useState<string[] | null>(null)
  const [rewriteLoading, setRewriteLoading] = useState(false)

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

  const generateAIBullets = async (itemIndex: number) => {
    const item = items[itemIndex]
    setAiGenerating(itemIndex)
    setAiResults(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bullets',
          data: { role: `${item.role} at ${item.company}`, context: aiContext || item.role },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 403) {
          alert(err.error)
          return
        }
        throw new Error(err.error)
      }
      const json = await res.json()
      setAiResults(json.result)
    } catch {
      alert('Failed to generate bullets. Please try again.')
    } finally {
      setAiGenerating(null)
    }
  }

  const rewriteBulletText = async (itemIndex: number, bulletIndex: number) => {
    const text = items[itemIndex].bullets[bulletIndex]
    if (!text.trim()) return
    setRewriteLoading(true)
    setRewriteResults(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rewrite',
          data: { text },
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (res.status === 403) {
          alert(err.error)
          return
        }
        throw new Error(err.error)
      }
      const json = await res.json()
      setRewriteResults(json.result)
    } catch {
      alert('Failed to rewrite. Please try again.')
    } finally {
      setRewriteLoading(false)
    }
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiInput(showAiInput === index ? null : index)}
                  className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Wand2 className="h-3 w-3" />
                  AI Generate
                </button>
                <button
                  onClick={() => setShowSuggestions(showSuggestions === index ? null : index)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  Templates
                </button>
              </div>
            </div>

            {/* AI Generator */}
            {showAiInput === index && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
                <p className="text-xs font-medium text-purple-700">Generate bullet points with AI</p>
                <input
                  className="block w-full rounded-lg border border-purple-300 px-3 py-2 text-sm placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                  placeholder="Describe your role and achievements..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => generateAIBullets(index)}
                    disabled={aiGenerating === index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    {aiGenerating === index ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    {aiGenerating === index ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => { setShowAiInput(null); setAiResults(null); setAiContext('') }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                {aiResults && (
                  <div className="space-y-1.5 mt-2 border-t border-purple-200 pt-2">
                    <p className="text-xs font-medium text-purple-700">Select bullets to add:</p>
                    {aiResults.map((bullet, bi) => (
                      <button
                        key={bi}
                        onClick={() => { addBullet(index, bullet); setAiResults(null) }}
                        className="block w-full text-left px-3 py-2 rounded-lg bg-white border border-purple-200 hover:border-purple-400 text-xs text-gray-700 transition-colors"
                      >
                        {bullet}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Static Suggestions */}
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
              <div key={bIndex} className="space-y-1">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe an achievement or responsibility"
                    value={bullet}
                    onChange={(e) => updateBullet(index, bIndex, e.target.value)}
                  />
                  {bullet.trim() && (
                    <button
                      onClick={() => {
                        setRewritingBullet({ item: index, bullet: bIndex })
                        rewriteBulletText(index, bIndex)
                      }}
                      className="text-purple-400 hover:text-purple-600 transition-colors"
                      title="Rewrite with AI"
                    >
                      <Wand2 className="h-4 w-4 mt-2.5" />
                    </button>
                  )}
                  {item.bullets.length > 1 && (
                    <button
                      onClick={() => removeBullet(index, bIndex)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mt-2.5" />
                    </button>
                  )}
                </div>

                {/* Rewrite results */}
                {rewritingBullet?.item === index && rewritingBullet?.bullet === bIndex && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-2 space-y-1.5">
                    {rewriteLoading ? (
                      <div className="flex items-center gap-2 text-xs text-purple-600 py-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Rewriting...
                      </div>
                    ) : rewriteResults ? (
                      <>
                        <p className="text-[10px] font-medium text-purple-700">Choose a rewrite:</p>
                        {rewriteResults.map((rewrite, ri) => (
                          <button
                            key={ri}
                            onClick={() => {
                              updateBullet(index, bIndex, rewrite)
                              setRewritingBullet(null)
                              setRewriteResults(null)
                            }}
                            className="block w-full text-left px-2 py-1 rounded text-xs text-gray-700 bg-white border border-purple-200 hover:border-purple-400 transition-colors"
                          >
                            {rewrite}
                          </button>
                        ))}
                        <button
                          onClick={() => { setRewritingBullet(null); setRewriteResults(null) }}
                          className="text-[10px] text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                  </div>
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
