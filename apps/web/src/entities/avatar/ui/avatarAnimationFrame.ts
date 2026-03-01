import * as THREE from "three";
import type { MutableRefObject, RefObject } from "react";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import {
  type BlinkState,
  type BoneKey,
  type BonePose,
  type BoneRig,
  type MorphBinding,
  type TimeDomainDataBuffer
} from "@/entities/avatar/ui/avatarAnimation.helpers";
import {
  applyAvatarMorphPhase,
  applyAvatarPosePhase
} from "@/entities/avatar/ui/avatarAnimationPhases";

type AvatarAnimationCharacter = "zet" | "luna" | "iron";
type AvatarAnimationEmotion = "neutral" | "encourage" | "pressure";

type AnimateAvatarFrameOptions = {
  elapsed: number;
  delta: number;
  character: AvatarAnimationCharacter;
  state: AvatarState;
  emotion: AvatarAnimationEmotion;
  reactionEnabled: boolean;
  audioRef?: RefObject<HTMLAudioElement>;
  morphBindingsRef: MutableRefObject<MorphBinding[]>;
  blinkStateRef: MutableRefObject<BlinkState>;
  rootGroupRef: MutableRefObject<THREE.Group | null>;
  boneRigRef: MutableRefObject<BoneRig>;
  boneBasePoseRef: MutableRefObject<Partial<Record<BoneKey, BonePose>>>;
  mouthEnvelopeRef: MutableRefObject<number>;
  cuePulseRef: MutableRefObject<number>;
  analyserRef: MutableRefObject<AnalyserNode | null>;
  analyserDataRef: MutableRefObject<TimeDomainDataBuffer | null>;
};

export function animateAvatarFrame({
  elapsed,
  delta,
  character,
  state,
  emotion,
  reactionEnabled,
  audioRef,
  morphBindingsRef,
  blinkStateRef,
  rootGroupRef,
  boneRigRef,
  boneBasePoseRef,
  mouthEnvelopeRef,
  cuePulseRef,
  analyserRef,
  analyserDataRef
}: AnimateAvatarFrameOptions) {
  cuePulseRef.current = Math.max(0, cuePulseRef.current - delta * 1.9);
  const cuePulse = cuePulseRef.current;
  applyAvatarMorphPhase({
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
  });
  applyAvatarPosePhase({
    elapsed,
    delta,
    character,
    state,
    cuePulse,
    rootGroupRef,
    boneRigRef,
    boneBasePoseRef
  });
}
