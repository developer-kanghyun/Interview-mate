import type { InterviewCharacterApi, InterviewEmotionApi } from "./interview.types.common";

export type SessionStartResponse = {
  success: boolean;
  data: {
    session_id: string;
    started_at: string;
    job_role: string;
    interviewer_character: InterviewCharacterApi;
    total_questions: number;
    status: string;
    first_question: {
      question_id: string;
      category: string;
      difficulty: string;
      content: string;
    };
  };
};

export type AnswerSubmitResponse = {
  success: boolean;
  data: {
    answer_id: string;
    session_id: string;
    question_id: string;
    input_type: string;
    interviewer_character: InterviewCharacterApi;
    evaluation: {
      accuracy: number;
      logic: number;
      depth: number;
      delivery: number;
      total_score: number;
      followup_required: boolean;
      followup_reason: string;
      followup_remaining: number;
    };
    feedback_summary: string | null;
    coaching_message: string | null;
    coaching_available: boolean;
    followup_question?: string | null;
    interviewer_emotion: InterviewEmotionApi;
    next_question?: {
      question_id: string;
      question_order: number;
      category: string;
      difficulty: string;
      content: string;
    } | null;
    session_status: string;
    end_reason: string | null;
    session_completed: boolean;
  };
};

export type SessionTimelineResponse = {
  success: boolean;
  data: {
    session_id: string;
    job_role: string;
    interviewer_character: InterviewCharacterApi;
    session_status: string;
    end_reason: string | null;
    summary: {
      pressure_count: number;
      encourage_count: number;
      neutral_count: number;
      scored_count: number;
      average_score: number | null;
    };
    items: Array<{
      answer_id: string;
      question_id: string;
      question_order: number;
      question_content: string;
      answer_text: string;
      interviewer_emotion: InterviewEmotionApi;
      score_total: number | null;
      followup_reason: string | null;
      answered_at: string;
    }>;
  };
};

export type SessionStateResponse = {
  success: boolean;
  data: {
    session_id: string;
    status: string;
    end_reason: string | null;
    job_role: string;
    stack: string | null;
    difficulty: string | null;
    interviewer_character: InterviewCharacterApi;
    total_questions: number;
    answered_questions: number;
    remaining_questions: number;
    completion_rate: number;
    updated_at: string;
    current_question: {
      question_id: string;
      question_order: number;
      category: string;
      difficulty: string;
      content: string;
      followup_count: number;
    } | null;
  };
};

export type SessionEndResponse = {
  success: boolean;
  data: {
    session_id: string;
    session_status: string;
    end_reason: string;
    ended_at: string;
  };
};

export type LatestActiveSessionApiResponse = {
  success: boolean;
  data: {
    has_active_session: boolean;
    session: SessionStateResponse["data"] | null;
  };
};

export type HealthApiResponse = {
  status: string;
  timestamp: string;
};
