export type InterviewRole = "backend" | "frontend" | "app" | "cloud" | "data" | "design" | "pm";
export type InterviewDifficulty = "jobseeker" | "junior";
export type InterviewCharacter = "zet" | "luna" | "iron";
export type InterviewEmotion = "neutral" | "encourage" | "pressure";

export type StartInterviewPayload = {
  jobRole: InterviewRole;
  stack: string;
  difficulty: InterviewDifficulty;
  questionCount: number;
  timerSeconds: number;
  character: InterviewCharacter;
  reactionEnabled: boolean;
  retryMode?: "none" | "weak_first";
  sourceSessionId?: string;
};

export type StartInterviewResponse = {
  sessionId: string;
  startedAt: string;
};

export type StreamQuestionEvent =
  | {
      type: "chunk";
      text: string;
    }
  | {
      type: "done";
      questionId: string;
      order: number;
      followupCount: number;
      content: string;
    };

export type AxisKey = "technical" | "problemSolving" | "communication" | "delivery";

export type AxisScores = Record<AxisKey, number>;

export type SubmitAnswerResponse = {
  feedbackSummary: string | null;
  coaching: string | null;
  coachingAvailable: boolean;
  axisScores: AxisScores;
  totalScore: number;
  suggestedEmotion: InterviewEmotion;
  shouldAskFollowup: boolean;
  followupCount: number;
  isSessionComplete: boolean;
  progress: {
    completedQuestions: number;
    totalQuestions: number;
  };
};

export type ReportQuestionFeedback = {
  questionId: string;
  order: number;
  question: string;
  feedback: string;
  totalScore: number;
  whyWeak: string;
  howToAnswer: string;
  exampleAnswer: string;
};

export type ReportQuestionGuide = {
  questionId: string;
  order: number;
  question: string;
  interviewerEmotion: InterviewEmotion;
  weakConceptKeywords: string[];
  actionTip: string;
  howToAnswer: string;
  exampleAnswer: string;
};

export type InterviewReport = {
  sessionId: string;
  summary: string;
  totalScore: number;
  axisScores: AxisScores;
  weakKeywords: string[];
  questionFeedback: ReportQuestionFeedback[];
  studyGuide: string[];
  questionGuides: ReportQuestionGuide[];
};

export type SessionHistoryItem = {
  sessionId: string;
  startedAt: string;
  role: InterviewRole;
  stack: string;
  totalScore: number;
  questionCount: number;
  status: "in_progress" | "completed";
};
