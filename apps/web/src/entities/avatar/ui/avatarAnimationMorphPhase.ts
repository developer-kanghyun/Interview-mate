import * as THREE from "three";
import type { MutableRefObject, RefObject } from "react";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import {
  applyMorph,
  clamp01,
  randomInRange,
  readAudioAmplitude,
  smoothFactor,
  type BlinkState,
  type MorphBinding,
  type TimeDomainDataBuffer
} from "@/entities/avatar/ui/avatarAnimation.helpers";

type AvatarAnimationEmotion = "neutral" | "encourage" | "pressure";

type ApplyAvatarMorphPhaseOptions = {
  elapsed: number;
  delta: number;
  state: AvatarState;
  emotion: AvatarAnimationEmotion;
  reactionEnabled: boolean;
  cuePulse: number;
  audioRef?: RefObject<HTMLAudioElement>;
  morphBindingsRef: MutableRefObject<MorphBinding[]>;
  blinkStateRef: MutableRefObject<BlinkState>;
  mouthEnvelopeRef: MutableRefObject<number>;
  analyserRef: MutableRefObject<AnalyserNode | null>;
  analyserDataRef: MutableRefObject<TimeDomainDataBuffer | null>;
};

export function applyAvatarMorphPhase({
  elapsed,
  delta,
  state,
  emotion,
  reactionEnabled,
  cuePulse,
  audioRef,
  morphBindingsRef,
  blinkStateRef,
  mouthEnvelopeRef,
  analyserRef,
  analyserDataRef
}: ApplyAvatarMorphPhaseOptions) {
  if (morphBindingsRef.current.length === 0) {
    return;
  }

  const blinkState = blinkStateRef.current;
  const audioAmplitude = readAudioAmplitude(analyserRef, analyserDataRef, audioRef);
  const audioElement = audioRef?.current;
  const isAudioPlaying = Boolean(audioElement && !audioElement.paused && !audioElement.ended);
  const silenceGate = 0.05;
  const gatedAmplitude = Math.max(0, audioAmplitude - silenceGate);
  const audioTarget = clamp01(gatedAmplitude * 1.2 + Math.max(0, Math.sin(elapsed * 18)) * 0.035);
  const fakeLipSync =
    state === "asking"
      ? clamp01((Math.sin(elapsed * 8.2) + 1) * 0.16 + (Math.sin(elapsed * 14.6) + 1) * 0.06)
      : 0;
  const idleMouthGain =
    state === "asking" ? 0.58 : state === "celebrate" ? 0.32 : state === "listening" ? 0.05 : 0.045;
  const speakingGain =
    state === "asking" ? 1 : state === "celebrate" ? 0.52 : state === "listening" ? 0.12 : 0.09;
  const targetMouth = isAudioPlaying ? audioTarget * speakingGain : fakeLipSync * idleMouthGain;
  const isOpeningMouth = targetMouth > mouthEnvelopeRef.current;
  const smoothing = smoothFactor(isOpeningMouth ? 14 : 30, delta);
  mouthEnvelopeRef.current = THREE.MathUtils.lerp(mouthEnvelopeRef.current, targetMouth, smoothing);

  let mouthOpen = mouthEnvelopeRef.current;
  if (isAudioPlaying && mouthOpen < 0.025) {
    mouthOpen = 0;
  }
  if (!isAudioPlaying && mouthOpen < 0.01) {
    mouthOpen = 0;
  }

  let smile = emotion === "encourage" ? 0.42 : 0.08;
  let frown = emotion === "pressure" ? 0.45 : 0.04;
  let browUp = emotion === "encourage" ? 0.2 : emotion === "pressure" ? 0.18 : 0.08;

  if (!reactionEnabled) {
    smile = 0.1;
    frown = 0.04;
    browUp = 0.08;
  }

  if (state === "thinking") {
    mouthOpen = 0.01;
    browUp = Math.max(browUp, 0.14);
  } else if (state === "listening") {
    mouthOpen *= 0.15;
  } else if (state === "celebrate") {
    smile = Math.max(smile, 0.62);
    frown = 0;
    mouthOpen = Math.max(mouthOpen, 0.15 + cuePulse * 0.08);
  } else if (state === "confused") {
    browUp = Math.max(browUp, 0.36);
    frown = Math.max(frown, 0.22);
    smile = Math.min(smile, 0.08);
    mouthOpen = Math.max(mouthOpen, 0.03);
  } else if (state === "react_negative") {
    frown = Math.max(frown, 0.62);
    smile = 0;
    mouthOpen = 0.02;
  }

  if (!blinkState.active && elapsed >= blinkState.nextAt) {
    blinkState.active = true;
    blinkState.startAt = elapsed;
    blinkState.duration = randomInRange(0.12, 0.18);
  }

  let blinkValue = 0;
  if (blinkState.active) {
    const progress = (elapsed - blinkState.startAt) / blinkState.duration;
    if (progress >= 1) {
      blinkState.active = false;
      blinkState.nextAt = elapsed + randomInRange(3.0, 6.0);
    } else {
      blinkValue = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    }
  }

  for (const binding of morphBindingsRef.current) {
    applyMorph(binding, "mouthOpen", mouthOpen, 0.28);
    applyMorph(binding, "smile", smile, 0.2);
    applyMorph(binding, "frown", frown, 0.2);
    applyMorph(binding, "browUp", browUp, 0.2);
    applyMorph(binding, "blink", blinkValue, 0.8);
  }
}
