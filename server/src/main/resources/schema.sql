-- message_role ENUM 타입 생성
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
        CREATE TYPE message_role AS ENUM ('user', 'assistant');
    END IF;
END $$;;

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    google_sub VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    is_guest BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);;

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255);;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS email VARCHAR(255);;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS name VARCHAR(255);;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub_unique ON users(google_sub);;

-- conversations 테이블
CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_conversations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);;

-- messages 테이블
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);;

-- interview_questions 테이블
CREATE TABLE IF NOT EXISTS interview_questions (
    id BIGSERIAL PRIMARY KEY,
    job_role VARCHAR(20) NOT NULL,
    question_category VARCHAR(30) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);;

-- interview_sessions 테이블
CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_role VARCHAR(20) NOT NULL,
    stack VARCHAR(120),
    difficulty VARCHAR(20),
    interviewer_character VARCHAR(20) NOT NULL DEFAULT 'jet',
    interviewer_pressure_count INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    end_reason VARCHAR(50),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_interview_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);;

ALTER TABLE IF EXISTS interview_sessions
    ADD COLUMN IF NOT EXISTS interviewer_character VARCHAR(20) NOT NULL DEFAULT 'jet';;
ALTER TABLE IF EXISTS interview_sessions
    ADD COLUMN IF NOT EXISTS interviewer_pressure_count INTEGER NOT NULL DEFAULT 0;;
ALTER TABLE IF EXISTS interview_sessions
    ADD COLUMN IF NOT EXISTS end_reason VARCHAR(50);;
ALTER TABLE IF EXISTS interview_sessions
    ADD COLUMN IF NOT EXISTS stack VARCHAR(120);;
ALTER TABLE IF EXISTS interview_sessions
    ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);;

-- interview_session_questions 테이블
CREATE TABLE IF NOT EXISTS interview_session_questions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    question_order INTEGER NOT NULL,
    followup_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_interview_session_questions_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_session_questions_question FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
);;

-- interview_answers 테이블
CREATE TABLE IF NOT EXISTS interview_answers (
    id BIGSERIAL PRIMARY KEY,
    session_question_id BIGINT NOT NULL,
    answer_text TEXT NOT NULL,
    input_type VARCHAR(20) NOT NULL,
    interviewer_emotion VARCHAR(20) NOT NULL DEFAULT 'neutral',
    score_accuracy DOUBLE PRECISION,
    score_logic DOUBLE PRECISION,
    score_depth DOUBLE PRECISION,
    score_delivery DOUBLE PRECISION,
    score_total DOUBLE PRECISION,
    followup_required BOOLEAN,
    followup_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_interview_answers_session_question FOREIGN KEY (session_question_id) REFERENCES interview_session_questions(id) ON DELETE CASCADE
);;

ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS interviewer_emotion VARCHAR(20) NOT NULL DEFAULT 'neutral';;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS score_accuracy DOUBLE PRECISION;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS score_logic DOUBLE PRECISION;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS score_depth DOUBLE PRECISION;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS score_delivery DOUBLE PRECISION;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS score_total DOUBLE PRECISION;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS followup_required BOOLEAN;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS followup_reason TEXT;;
ALTER TABLE IF EXISTS interview_answers
    ALTER COLUMN followup_reason TYPE TEXT;;
ALTER TABLE IF EXISTS interview_answers
    ADD COLUMN IF NOT EXISTS coaching_message VARCHAR(400);;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_updated_at ON conversations(user_id, updated_at DESC);;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_created_at ON messages(conversation_id, created_at ASC);;
CREATE INDEX IF NOT EXISTS idx_interview_questions_role_active ON interview_questions(job_role, is_active);;
CREATE INDEX IF NOT EXISTS idx_interview_session_questions_session_order ON interview_session_questions(session_id, question_order);;
CREATE INDEX IF NOT EXISTS idx_interview_answers_session_question ON interview_answers(session_question_id);;
