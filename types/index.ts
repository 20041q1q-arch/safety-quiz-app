// ──────────────────────────────────────
// 문제 관련 타입
// ──────────────────────────────────────

export interface Question {
  id: number
  subject: string
  year: number | null
  round: number | null      // 회차
  question: string
  options: string[]         // 4지선다
  answer: number            // 1-based
  explanation: string
  image_url?: string        // 문제 이미지
  exp_image_url?: string    // 해설 이미지
  tags?: string[]
  difficulty?: 1 | 2 | 3
  ocr_text?: string
}

// ──────────────────────────────────────
// 사용자 학습 이력
// ──────────────────────────────────────

export interface UserProgress {
  question_id: number
  correct_count: number
  wrong_count: number
  streak: number             // 연속 정답 횟수
  mastery_score: number      // 0.0 ~ 1.0
  last_solved_at: string | null
  next_review_at: string | null
  avg_time_ms: number
}

export type MasteryState = 'weak' | 'uncertain' | 'mastered'

// ──────────────────────────────────────
// 퀴즈 세션
// ──────────────────────────────────────

export type QuizMode = 'subject' | 'speed' | 'wrong-only' | 'review'

export interface QuizSession {
  questions: Question[]
  currentIndex: number
  answers: Record<number, number>   // question_id → chosen (1-based)
  startedAt: number
  mode: QuizMode
  subject: string | null
}

// ──────────────────────────────────────
// 모의고사
// ──────────────────────────────────────

export interface ExamMeta {
  type: 'year' | 'random'
  year?: number
  round?: number
  label: string
  durationSec: number       // 시험 제한시간 (초)
}

export interface ExamResult {
  totalCount: number
  correctCount: number
  score: number             // 0~100
  passed: boolean
  subjectScores: Record<string, { correct: number; total: number }>
  wrongQuestions: Question[]
  durationMs: number
}

// ──────────────────────────────────────
// 통계
// ──────────────────────────────────────

export interface SubjectStat {
  subject: string
  totalAttempted: number
  correctCount: number
  wrongCount: number
  accuracy: number          // 0~100
  masteredCount: number
  weakCount: number
}

export interface DailyStat {
  date: string              // YYYY-MM-DD
  solved: number
  correct: number
}

// ──────────────────────────────────────
// 설정
// ──────────────────────────────────────

export interface AppSettings {
  autoNext: boolean         // 정답 후 자동 다음 문제
  autoNextDelaySec: number  // 자동 이동 대기 초
  soundEnabled: boolean
  vibrationEnabled: boolean
  showExplanation: boolean  // 즉시 해설 표시
  theme: 'dark' | 'light'
  fontSize: 'sm' | 'md' | 'lg'
  speedModeAutoSec: number  // 초고속 모드 자동 이동 초
}

// ──────────────────────────────────────
// 관리자 업로드
// ──────────────────────────────────────

export interface UploadRow {
  subject: string
  year: number | null
  round: number | null
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  answer: number
  explanation: string
  image_url?: string
}

export interface UploadResult {
  inserted: number
  duplicates: number
  errors: string[]
}
