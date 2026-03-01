import type { InterviewReport, StartInterviewPayload } from "@/shared/api/interview-client";

type RetryPreset = {
  jobRole?: StartInterviewPayload["jobRole"];
  stack?: StartInterviewPayload["stack"];
};

export function buildWeakRetryPayloads(params: {
  setupPayload: StartInterviewPayload;
  report: InterviewReport;
  retryPreset: RetryPreset;
}) {
  const { setupPayload, report, retryPreset } = params;

  const retryPayloadForSetup: StartInterviewPayload = {
    ...setupPayload,
    ...retryPreset,
    difficulty: report.totalScore >= 70 ? "junior" : "jobseeker",
    questionCount: Math.min(setupPayload.questionCount, 5),
    retryMode: undefined,
    sourceSessionId: undefined
  };

  const retryPayloadForStart: StartInterviewPayload = {
    ...retryPayloadForSetup,
    retryMode: "weak_first",
    sourceSessionId: report.sessionId
  };

  return {
    retryPayloadForSetup,
    retryPayloadForStart
  };
}
