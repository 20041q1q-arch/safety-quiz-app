-- 설비보전산업기사 필기 앱 초기 스키마

-- 문제 테이블
CREATE TABLE IF NOT EXISTS questions (
  id              BIGSERIAL PRIMARY KEY,
  subject         TEXT NOT NULL,
  year            SMALLINT,
  round           SMALLINT,
  question        TEXT NOT NULL,
  choices         JSONB NOT NULL,        -- ["선택1","선택2","선택3","선택4"]
  answer          SMALLINT NOT NULL,     -- 1-based
  explanation     TEXT DEFAULT '',
  image_url       TEXT,
  exp_image_url   TEXT,
  tags            TEXT[] DEFAULT '{}',
  difficulty      SMALLINT DEFAULT 2,    -- 1~3
  ocr_text        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_answer CHECK (answer BETWEEN 1 AND 4)
);

CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_year_round ON questions(year, round);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);

-- 사용자 학습 이력
CREATE TABLE IF NOT EXISTS user_progress (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id     BIGINT REFERENCES questions(id) ON DELETE CASCADE,
  correct_count   INT DEFAULT 0,
  wrong_count     INT DEFAULT 0,
  streak          INT DEFAULT 0,
  mastery_score   FLOAT DEFAULT 0,       -- 0.0 ~ 1.0
  last_solved_at  TIMESTAMPTZ,
  next_review_at  TIMESTAMPTZ,
  avg_time_ms     INT DEFAULT 0,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_review ON user_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_progress_mastery ON user_progress(user_id, mastery_score);

-- 모의고사 세션
CREATE TABLE IF NOT EXISTS exam_sessions (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type       TEXT NOT NULL,         -- 'year' | 'random'
  year            SMALLINT,
  round           SMALLINT,
  answers         JSONB NOT NULL,        -- {question_id: chosen_index}
  score           FLOAT,
  subject_scores  JSONB,
  duration_ms     INT,
  passed          BOOLEAN,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON exam_sessions(user_id);

-- RLS 정책
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_progress_own" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_sessions_own" ON exam_sessions
  FOR ALL USING (auth.uid() = user_id);
