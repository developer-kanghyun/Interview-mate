export type {
  AxisKey,
  AxisScores,
  InterviewCharacter,
  InterviewDifficulty,
  InterviewEmotion,
  InterviewReport,
  InterviewRole,
  ReportQuestionFeedback,
  ReportQuestionGuide,
  SessionHistoryItem,
  StartInterviewPayload,
  StartInterviewResponse,
  StreamQuestionEvent,
  SubmitAnswerResponse
} from "@/shared/api/interview-client.types";

export {
  getReport,
  hasInterviewRuntimeState,
  listSessions,
  pingBackendHealth,
  restoreInterviewSession,
  startInterview,
  submitAnswer
} from "@/shared/api/interview-client.session-actions";

export { streamQuestion } from "@/shared/api/interview-client.question-stream";
