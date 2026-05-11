import { readFileSync } from 'fs'
import { join } from 'path'
import QuizSubjectClient from './QuizSubjectClient'

export function generateStaticParams() {
  const raw = readFileSync(join(process.cwd(), 'public', 'data', 'questions.json'), 'utf-8')
  const data = JSON.parse(raw) as { subject: string }[]
  const subjects = [...new Set(data.map((q) => q.subject))]
  return [...subjects.map((s) => ({ subject: s })), { subject: '전체' }]
}

export default function Page() {
  return <QuizSubjectClient />
}
