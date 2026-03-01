import type { InterviewEmotionApi } from "./interview.types.common";

export type SessionReportResponse = {
  success: boolean;
  data: {
    session_id: string;
    job_role: string;
    session_status: string;
    end_reason: string | null;
    total_questions: number;
    answered_questions: number;
    performance_level: string;
    priority_focuses: string[];
    score_summary: {
      accuracy: number;
      logic: number;
      depth: number;
      delivery: number;
      total_score: number;
    };
    weak_keywords: string[];
    generated_at: string;
    questions: Array<{
      question_id: string;
      question_order: number;
      question_content: string;
      answer_text: string;
      interviewer_emotion: InterviewEmotionApi;
      coaching_message: string | null;
      model_answer: string;
      score: {
        accuracy: number;
        logic: number;
        depth: number;
        delivery: number;
        total_score: number;
      };
      weak_points: string[];
      weak_concept_keywords: string[];
      improvement_tip: string;
      why_weak?: string | null;
      how_to_answer?: string | null;
      example_answer?: string | null;
    }>;
  };
};

export type SessionStudyResponse = {
  success: boolean;
  data: {
    session_id: string;
    job_role: string;
    performance_level: string;
    weak_keywords: string[];
    recommended_actions: string[];
    question_guides: Array<{
      question_order: number;
      question_content: string;
      interviewer_emotion: InterviewEmotionApi;
      weak_concept_keywords: string[];
      model_answer_preview: string;
      action_tip: string;
      how_to_answer?: string | null;
      example_answer?: string | null;
    }>;
  };
};

export type InterviewHistoryApiResponse = {
  success: boolean;
  data: {
    requested_days: number;
    total_count: number;
    items: Array<{
      session_id: string;
      session_end_reason: string | null;
      question_id: string;
      question_order: number;
      question_content: string;
      answer_text: string;
      input_type: string;
      interviewer_emotion: InterviewEmotionApi;
      total_score: number;
      followup_reason: string;
      answered_at: string;
    }>;
  };
};
