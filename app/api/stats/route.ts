import { NextRequest, NextResponse } from 'next/server'
import type { UserProgress, SubjectStat, Question } from '@/types'
import { getMasteryState } from '@/lib/algorithms/mastery'
import { readFile } from 'fs/promises'
import path from 'path'

async function getQuestions(): Promise<Question[]> {
  const filePath = path.join(process.cwd(), 'data', 'questions.json')
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

export async function POST(req: NextRequest) {
  try {
    const { progressMap } = (await req.json()) as {
      progressMap: Record<number, UserProgress>
    }

    const questions = await getQuestions()

    const subjectMap: Record<string, SubjectStat> = {}

    for (const q of questions) {
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = {
          subject: q.subject,
          totalAttempted: 0,
          correctCount: 0,
          wrongCount: 0,
          accuracy: 0,
          masteredCount: 0,
          weakCount: 0,
        }
      }

      const p = progressMap[q.id]
      if (!p || p.correct_count + p.wrong_count === 0) continue

      const stat = subjectMap[q.subject]
      stat.totalAttempted++
      stat.correctCount += p.correct_count
      stat.wrongCount += p.wrong_count

      const state = getMasteryState(p.mastery_score)
      if (state === 'mastered') stat.masteredCount++
      if (state === 'weak') stat.weakCount++
    }

    for (const stat of Object.values(subjectMap)) {
      const total = stat.correctCount + stat.wrongCount
      stat.accuracy = total === 0 ? 0 : Math.round((stat.correctCount / total) * 100)
    }

    return NextResponse.json(Object.values(subjectMap))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
