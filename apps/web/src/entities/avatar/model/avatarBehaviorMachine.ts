export type AvatarState =
  | "idle"
  | "asking"
  | "listening"
  | "thinking"
  | "confused"
  | "celebrate"
  | "react_negative";

export type AvatarTransientState = "confused" | "celebrate";
export type AvatarEmotionSignal = "neutral" | "encourage" | "pressure";

const AVATAR_TRANSIENT_DURATION_MS: Record<AvatarTransientState, number> = {
  confused: 1200,
  celebrate: 1500
};

export function isAvatarTransientState(state: AvatarState): state is AvatarTransientState {
  return state === "confused" || state === "celebrate";
}

export function getAvatarTransientDurationMs(state: AvatarTransientState) {
  return AVATAR_TRANSIENT_DURATION_MS[state];
}

export function resolveAvatarTransientStateFromAnswer(params: {
  previousFollowupCount: number;
  nextFollowupCount: number;
  totalScore: number;
  suggestedEmotion: AvatarEmotionSignal;
}): AvatarTransientState | null {
  if (params.nextFollowupCount > params.previousFollowupCount) {
    return "confused";
  }

  if (params.totalScore >= 80 || params.suggestedEmotion === "encourage") {
    return "celebrate";
  }

  return null;
}

export function resolveAvatarReportState(totalScore: number): AvatarState {
  return totalScore >= 75 ? "celebrate" : "react_negative";
}
