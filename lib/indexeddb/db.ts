import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Question, UserProgress } from '@/types'

interface QuizDB extends DBSchema {
  questions: {
    key: number
    value: Question
    indexes: { by_subject: string; by_year_round: [number, number] }
  }
  progress: {
    key: number   // question_id
    value: UserProgress
  }
  settings: {
    key: string
    value: unknown
  }
}

let _db: IDBPDatabase<QuizDB> | null = null

export async function getDB(): Promise<IDBPDatabase<QuizDB>> {
  if (_db) return _db

  _db = await openDB<QuizDB>('quiz-app', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const qStore = db.createObjectStore('questions', { keyPath: 'id' })
        qStore.createIndex('by_subject', 'subject')
        qStore.createIndex('by_year_round', ['year', 'round'])

        db.createObjectStore('progress', { keyPath: 'question_id' })
        db.createObjectStore('settings')
      }
    },
  })

  return _db
}

// ──────────────────────────────────────
// 문제 캐시
// ──────────────────────────────────────

export async function cacheQuestions(questions: Question[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('questions', 'readwrite')
  await Promise.all([
    ...questions.map((q) => tx.store.put(q)),
    tx.done,
  ])
}

export async function getCachedQuestions(): Promise<Question[]> {
  const db = await getDB()
  return db.getAll('questions')
}

export async function getCachedBySubject(subject: string): Promise<Question[]> {
  const db = await getDB()
  return db.getAllFromIndex('questions', 'by_subject', subject)
}

export async function isCacheEmpty(): Promise<boolean> {
  const db = await getDB()
  const count = await db.count('questions')
  return count === 0
}

// ──────────────────────────────────────
// 학습 이력
// ──────────────────────────────────────

export async function getProgress(questionId: number): Promise<UserProgress | undefined> {
  const db = await getDB()
  return db.get('progress', questionId)
}

export async function getAllProgress(): Promise<UserProgress[]> {
  const db = await getDB()
  return db.getAll('progress')
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  const db = await getDB()
  await db.put('progress', progress)
}

export async function bulkSaveProgress(items: UserProgress[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('progress', 'readwrite')
  await Promise.all([...items.map((p) => tx.store.put(p)), tx.done])
}

// ──────────────────────────────────────
// 설정
// ──────────────────────────────────────

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB()
  return db.get('settings', key) as Promise<T | undefined>
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB()
  await db.put('settings', value, key)
}
