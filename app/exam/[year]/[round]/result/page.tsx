import { readFileSync } from 'fs'
import { join } from 'path'
import ResultClient from './ResultClient'

export function generateStaticParams() {
  const raw = readFileSync(join(process.cwd(), 'public', 'data', 'questions.json'), 'utf-8')
  const data = JSON.parse(raw) as { year: number; round: number }[]
  const combos = new Map<string, { year: string; round: string }>()
  for (const q of data) {
    if (q.year && q.round) {
      const key = `${q.year}-${q.round}`
      if (!combos.has(key)) combos.set(key, { year: String(q.year), round: String(q.round) })
    }
  }
  return [...combos.values()]
}

export default function Page() {
  return <ResultClient />
}
