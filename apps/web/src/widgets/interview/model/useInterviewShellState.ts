"use client";

import {
  useInterviewShellOrchestrator,
  type UseInterviewShellStateOptions,
  type UseInterviewShellStateResult
} from "@/features/interview-session/model/useInterviewShellOrchestrator";

export type { UseInterviewShellStateOptions, UseInterviewShellStateResult };

export function useInterviewShellState(options: UseInterviewShellStateOptions = {}): UseInterviewShellStateResult {
  return useInterviewShellOrchestrator(options);
}
