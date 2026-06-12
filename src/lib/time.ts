export function getDaysAgo(created: string): number | null {
  if (!created) return null
  return Math.floor((Date.now() - new Date(created).getTime()) / (1000 * 60 * 60 * 24))
}

