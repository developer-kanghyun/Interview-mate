export type InterviewRoleApi = "backend" | "frontend" | "app" | "cloud" | "data" | "design" | "pm";
export type InterviewDifficultyApi = "jobseeker" | "junior";
export type InterviewCharacterApi = "luna" | "jet" | "iron";
export type InterviewEmotionApi = "neutral" | "encourage" | "pressure";

export type StartInterviewSessionPayload = {
  jobRole: InterviewRoleApi;
  stack: string;
  difficulty: InterviewDifficultyApi;
  interviewerCharacter: InterviewCharacterApi;
  retryMode?: "none" | "weak_first";
  sourceSessionId?: number;
};

export type SubmitInterviewAnswerPayload = {
  sessionId: string;
  questionId: string;
  answerText: string;
  inputType: "text" | "voice";
};

export type SessionEndReason = "user_end" | "completed_all_questions";

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

export type GoogleAuthUrlApiResponse = {
  success: boolean;
  data: {
    auth_url: string;
    state: string;
  };
};

export type GoogleAuthCallbackApiResponse = {
  success: boolean;
  data: {
    user_id: string;
    email: string;
    name: string;
    new_user: boolean;
  };
};

export type GuestAuthApiResponse = {
  success: boolean;
  data: {
    user_id: string;
    trial_question_limit: number;
  };
};

export type AuthMeApiResponse = {
  success: boolean;
  data: {
    user_id: string;
    email: string | null;
    name: string | null;
  };
};

export type HealthApiResponse = {
  status: string;
  timestamp: string;
};
