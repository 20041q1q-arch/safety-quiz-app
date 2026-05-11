import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import type { Question, UserProgress } from '@/types'
import { selectWeightedQuestions } from '@/lib/algorithms/randomize'

let _cache: Question[] | null = null

async function getQuestions(): Promise<Question[]> {
  if (_cache) return _cache
  const filePath = path.join(process.cwd(), 'data', 'questions.json')
  const raw = await readFile(filePath, 'utf-8')
  _cache = JSON.parse(raw)
  return _cache!
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subject, count = 60, progressMap = {} } = body as {
      subject?: string
      count?: number
      progressMap?: Record<number, UserProgress>
    }

    let pool = await getQuestions()
    if (subject) pool = pool.filter((q) => q.subject === subject)

    const selected = selectWeightedQuestions(pool, count, progressMap)

    return NextResponse.json(selected)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
