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
