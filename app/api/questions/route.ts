import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import type { Question } from '@/types'

let _cache: Question[] | null = null

async function getQuestions(): Promise<Question[]> {
  if (_cache) return _cache
  const filePath = path.join(process.cwd(), 'data', 'questions.json')
  const raw = await readFile(filePath, 'utf-8')
  _cache = JSON.parse(raw)
  return _cache!
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subject = searchParams.get('subject')
  const year = searchParams.get('year')
  const round = searchParams.get('round')

  try {
    let questions = await getQuestions()

    if (subject) questions = questions.filter((q) => q.subject === subject)
    if (year) questions = questions.filter((q) => q.year === Number(year))
    if (round) questions = questions.filter((q) => q.round === Number(round))

    return NextResponse.json(questions)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
