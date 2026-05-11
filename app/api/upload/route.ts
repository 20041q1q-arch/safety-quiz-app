import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import type { Question, UploadResult } from '@/types'

/**
 * 문제 업로드 API
 *
 * 지원 형식: JSON 배열
 * 필수 필드: subject, question, options(4개), answer(1~4)
 * 선택 필드: year, round, explanation, image_url, exp_image_url, tags, difficulty
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rows: Partial<Question>[] = Array.isArray(body) ? body : [body]

    const filePath = path.join(process.cwd(), 'data', 'questions.json')
    const existing: Question[] = JSON.parse(await readFile(filePath, 'utf-8'))
    const maxId = existing.reduce((m, q) => Math.max(m, q.id), 0)

    const result: UploadResult = { inserted: 0, duplicates: 0, errors: [] }
    const newQuestions: Question[] = []

    rows.forEach((row, i) => {
      // 검증
      if (!row.subject) { result.errors.push(`Row ${i + 1}: subject 누락`); return }
      if (!row.question) { result.errors.push(`Row ${i + 1}: question 누락`); return }
      if (!Array.isArray(row.options) || row.options.length !== 4) {
        result.errors.push(`Row ${i + 1}: options는 4개 배열이어야 함`); return
      }
      if (!row.answer || row.answer < 1 || row.answer > 4) {
        result.errors.push(`Row ${i + 1}: answer는 1~4 사이 숫자여야 함`); return
      }

      // 중복 탐지 (동일 subject + question)
      const isDup = existing.some(
        (q) => q.subject === row.subject && q.question === row.question,
      )
      if (isDup) { result.duplicates++; return }

      newQuestions.push({
        id: maxId + result.inserted + 1,
        subject: row.subject!,
        year: row.year ?? null,
        round: row.round ?? null,
        question: row.question!,
        options: row.options!,
        answer: row.answer!,
        explanation: row.explanation ?? '',
        image_url: row.image_url,
        exp_image_url: row.exp_image_url,
        tags: row.tags ?? [],
        difficulty: row.difficulty ?? 2,
      })
      result.inserted++
    })

    if (newQuestions.length > 0) {
      const merged = [...existing, ...newQuestions]
      await writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8')
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
