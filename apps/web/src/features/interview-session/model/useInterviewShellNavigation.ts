"use client";

import { useCallback } from "react";
import type { InterviewStep } from "@/features/interview-session/model/interviewSession.constants";

type HistoryMode = "push" | "replace";

export function useInterviewShellNavigation(sessionId: string | null, setStep: (next: InterviewStep) => void) {
  const syncPathname = useCallback((nextPath: string, mode: HistoryMode = "push") => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname === nextPath) {
      return;
    }

    if (mode === "replace") {
      window.history.replaceState(window.history.state, "", nextPath);
      return;
    }

    window.history.pushState(window.history.state, "", nextPath);
  }, []);

  const updateStep = useCallback(
    (next: InterviewStep) => {
      if (next === "setup") {
        syncPathname("/setup");
      } else if (next === "insights") {
        syncPathname("/study");
      } else if (next === "report") {
        if (sessionId) {
          syncPathname(`/report/${encodeURIComponent(sessionId)}`);
        } else {
          syncPathname("/report");
        }
      }
      setStep(next);
    },
    [sessionId, setStep, syncPathname]
  );

  return {
    syncPathname,
    updateStep
  };
}
