"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  getAvatarTransientDurationMs,
  type AvatarState,
  type AvatarTransientState
} from "@/entities/avatar/model/avatarBehaviorMachine";

export function useRoomAvatarCue() {
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [activeAvatarCue, setActiveAvatarCue] = useState<AvatarTransientState | null>(null);
  const [avatarCueToken, setAvatarCueToken] = useState(0);
  const avatarCueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAvatarCue = useCallback((cue: AvatarTransientState) => {
    if (avatarCueTimerRef.current) {
      clearTimeout(avatarCueTimerRef.current);
    }

    setActiveAvatarCue(cue);
    setAvatarCueToken((current) => current + 1);
    avatarCueTimerRef.current = setTimeout(() => {
      setActiveAvatarCue(null);
      avatarCueTimerRef.current = null;
    }, getAvatarTransientDurationMs(cue));
  }, []);

  const clearAvatarCue = useCallback(() => {
    if (avatarCueTimerRef.current) {
      clearTimeout(avatarCueTimerRef.current);
      avatarCueTimerRef.current = null;
    }
    setActiveAvatarCue(null);
  }, []);

  const clearAvatarCueTimer = useCallback(() => {
    if (avatarCueTimerRef.current) {
      clearTimeout(avatarCueTimerRef.current);
      avatarCueTimerRef.current = null;
    }
  }, []);

  const effectiveAvatarState = useMemo(() => activeAvatarCue ?? avatarState, [activeAvatarCue, avatarState]);

  return {
    avatarState,
    setAvatarState,
    effectiveAvatarState,
    avatarCueToken,
    triggerAvatarCue,
    clearAvatarCue,
    clearAvatarCueTimer
  };
}
