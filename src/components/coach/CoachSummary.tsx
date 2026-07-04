'use client'

interface CoachingSummary {
  insights: string[]
  strengths: string[]
  blindSpots: string[]
  nextSteps: string[]
}

export function CoachSummary({ summary }: { summary: CoachingSummary }) {
  const textContent = [
    '=== Kavya Coaching Summary ===',
    '',
    '--- Insights ---',
    ...summary.insights.map((s) => `• ${s}`),
    '',
    '--- Strengths ---',
    ...summary.strengths.map((s) => `• ${s}`),
    '',
    '--- Areas to Explore ---',
    ...summary.blindSpots.map((s) => `• ${s}`),
    '',
    '--- Next Steps ---',
    ...summary.nextSteps.map((s) => `• ${s}`),
    '',
    'Powered by MyCareerDock — Kavya Career Coach',
  ].join('\n')

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textContent)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Your Coaching Summary
        </h1>
        <p className="text-[var(--text-secondary)]">
          Here is what emerged from our conversation. Take a moment to reflect on these insights.
        </p>
      </div>

      <div className="space-y-6">
        <Section title="Insights" color="var(--accent)" items={summary.insights} />
        <Section title="Strengths" color="#0E833E" items={summary.strengths} />
        <Section title="Areas to Explore" color="#D97706" items={summary.blindSpots} />
        <Section title="Next Steps" color="#0052FF" items={summary.nextSteps} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Copy Summary
        </button>
      </div>

      <p className="text-sm text-[var(--text-tertiary)]">
        Come back anytime for another conversation. Your journey evolves, and Kavya will be here.
      </p>
    </div>
  )
}

function Section({ title, color, items }: { title: string; color: string; items: string[] }) {
  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color }}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <span className="mt-0.5 flex-shrink-0" style={{ color }}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
