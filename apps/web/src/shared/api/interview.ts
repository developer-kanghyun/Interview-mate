import { requestJson } from "@/shared/api/http";

export type SessionStartResponse = {
  success: boolean;
  data: {
    session_id: string;
    started_at: string;
    job_role: string;
    interviewer_character: "luna" | "jet" | "iron";
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
    interviewer_character: "luna" | "jet" | "iron";
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
    interviewer_emotion: "neutral" | "encourage" | "pressure";
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
      interviewer_emotion: "neutral" | "encourage" | "pressure";
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
      interviewer_emotion: "neutral" | "encourage" | "pressure";
      weak_concept_keywords: string[];
      model_answer_preview: string;
      action_tip: string;
    }>;
  };
};

export type SessionTimelineResponse = {
  success: boolean;
  data: {
    session_id: string;
    job_role: string;
    interviewer_character: "luna" | "jet" | "iron";
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
      interviewer_emotion: "neutral" | "encourage" | "pressure";
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
    interviewer_character: "luna" | "jet" | "iron";
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
      interviewer_emotion: "neutral" | "encourage" | "pressure";
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

export async function startInterviewSession(payload: {
  jobRole: "backend" | "frontend" | "app" | "cloud" | "data" | "design" | "pm";
  stack: string;
  difficulty: "jobseeker" | "junior";
  interviewerCharacter: "luna" | "jet" | "iron";
}) {
  return requestJson<SessionStartResponse>("/api/interview/sessions/start", {
    method: "POST",
    body: {
      job_role: payload.jobRole,
      stack: payload.stack,
      difficulty: payload.difficulty,
      interviewer_character: payload.interviewerCharacter
    },
    fallbackMessage: "세션 시작 실패"
  });
}

export async function submitInterviewAnswer(payload: {
  sessionId: string;
  questionId: string;
  answerText: string;
  inputType: "text" | "voice";
}) {
  return requestJson<AnswerSubmitResponse>(`/api/interview/sessions/${payload.sessionId}/answers`, {
    method: "POST",
    body: {
      question_id: Number(payload.questionId),
      answer_text: payload.answerText,
      input_type: payload.inputType
    },
    fallbackMessage: "답변 제출 실패"
  });
}

export async function getInterviewSessionReport(sessionId: string) {
  return requestJson<SessionReportResponse>(`/api/interview/sessions/${sessionId}/report`, {
    method: "GET",
    fallbackMessage: "리포트 조회 실패"
  });
}

export async function getInterviewSessionStudy(sessionId: string) {
  return requestJson<SessionStudyResponse>(`/api/interview/sessions/${sessionId}/study`, {
    method: "GET",
    fallbackMessage: "공부 가이드 조회 실패"
  });
}

export async function getInterviewSessionTimeline(sessionId: string) {
  return requestJson<SessionTimelineResponse>(`/api/interview/sessions/${sessionId}/timeline`, {
    method: "GET",
    fallbackMessage: "세션 타임라인 조회 실패"
  });
}

export async function getInterviewSessionState(sessionId: string) {
  return requestJson<SessionStateResponse>(`/api/interview/sessions/${sessionId}`, {
    method: "GET",
    fallbackMessage: "세션 상태 조회 실패"
  });
}

export async function endInterviewSession(sessionId: string, reason: "user_end" | "completed_all_questions" = "user_end") {
  return requestJson<SessionEndResponse>(`/api/interview/sessions/${sessionId}/end`, {
    method: "POST",
    body: {
      reason
    },
    fallbackMessage: "세션 종료 실패"
  });
}

export async function getLatestActiveInterviewSession() {
  return requestJson<LatestActiveSessionApiResponse>("/api/interview/sessions/latest-active", {
    method: "GET",
    fallbackMessage: "최근 진행 세션 조회 실패"
  });
}

export async function getInterviewHistory(days = 30) {
  return requestJson<InterviewHistoryApiResponse>(`/api/interview/history?days=${days}`, {
    method: "GET",
    fallbackMessage: "히스토리 조회 실패"
  });
}

export async function getGoogleAuthUrl() {
  return requestJson<GoogleAuthUrlApiResponse>("/api/auth/google/url", {
    method: "GET",
    requireAuth: false,
    fallbackMessage: "Google 로그인 URL 조회 실패"
  });
}

export async function completeGoogleAuth(code: string, state?: string | null) {
  const query = new URLSearchParams();
  query.set("code", code);
  if (state) {
    query.set("state", state);
  }
  return requestJson<GoogleAuthCallbackApiResponse>(`/api/auth/google/callback?${query.toString()}`, {
    method: "GET",
    requireAuth: false,
    fallbackMessage: "Google 로그인 처리 실패"
  });
}

export async function getGuestAccess() {
  return requestJson<GuestAuthApiResponse>("/api/auth/guest", {
    method: "GET",
    requireAuth: false,
    fallbackMessage: "게스트 인증 발급 실패"
  });
}

export async function getMyProfile() {
  return requestJson<AuthMeApiResponse>("/api/auth/me", {
    method: "GET",
    fallbackMessage: "로그인 사용자 조회 실패"
  });
}

export async function getHealthStatus() {
  return requestJson<HealthApiResponse>("/health", {
    method: "GET",
    requireAuth: false,
    fallbackMessage: "백엔드 연결 확인 실패"
  });
}
