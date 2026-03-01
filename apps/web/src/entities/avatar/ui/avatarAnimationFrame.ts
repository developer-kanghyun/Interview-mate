import * as THREE from "three";
import type { MutableRefObject, RefObject } from "react";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import { AVATAR_RELAX_POSE_CALIBRATION } from "@/entities/avatar/model/avatarPoseCalibration";
import {
  accumulateBoneEuler,
  applyMorph,
  blendBoneEuler,
  clamp01,
  randomInRange,
  readAudioAmplitude,
  smoothFactor,
  type BlinkState,
  type BoneEulerOffset,
  type BoneEulerOffsets,
  type BoneKey,
  type BonePose,
  type BoneRig,
  type MorphBinding,
  type TimeDomainDataBuffer
} from "@/entities/avatar/ui/avatarAnimation.helpers";

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
  const blinkState = blinkStateRef.current;
  const group = rootGroupRef.current;
  const rig = boneRigRef.current;
  const basePose = boneBasePoseRef.current;
  const hasMorphBindings = morphBindingsRef.current.length > 0;
  cuePulseRef.current = Math.max(0, cuePulseRef.current - delta * 1.9);
  const cuePulse = cuePulseRef.current;
  const boneLerp = smoothFactor(10, delta);
  const relaxCalibration = AVATAR_RELAX_POSE_CALIBRATION[character].relax;
  const poseOffsets: BoneEulerOffsets = {};

  if (hasMorphBindings) {
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

  const breath = Math.sin(elapsed * 1.8) * 0.03;
  const subtleTurn = Math.sin(elapsed * 0.9) * 0.03;

  accumulateBoneEuler(poseOffsets, "spine", breath * 0.08, subtleTurn * 0.08, 0);
  accumulateBoneEuler(poseOffsets, "spine1", breath * 0.12, subtleTurn * 0.12, 0);
  accumulateBoneEuler(poseOffsets, "spine2", breath * 0.16, subtleTurn * 0.16, 0);
  accumulateBoneEuler(poseOffsets, "neck", 0, subtleTurn * 0.45, 0);
  accumulateBoneEuler(poseOffsets, "head", 0.02, subtleTurn * 0.56, 0);

  (Object.entries(relaxCalibration) as Array<
    [keyof typeof relaxCalibration, (typeof relaxCalibration)[keyof typeof relaxCalibration]]
  >).forEach(([key, offset]) => {
    if (!offset) {
      return;
    }
    accumulateBoneEuler(poseOffsets, key as BoneKey, offset.x, offset.y, offset.z);
  });

  if (state === "listening") {
    const nod = Math.sin(elapsed * 6.2) * 0.32;
    accumulateBoneEuler(poseOffsets, "head", 0.08 + nod, subtleTurn * 0.42, 0);
    accumulateBoneEuler(poseOffsets, "neck", nod * 0.6, subtleTurn * 0.28, 0);
    accumulateBoneEuler(poseOffsets, "spine2", nod * 0.11, 0, 0);
  } else if (state === "asking") {
    const gesture = 0.44 + Math.sin(elapsed * 4.9) * 0.3;
    const wrist = Math.sin(elapsed * 6.4) * 0.24;
    accumulateBoneEuler(poseOffsets, "rightShoulder", -0.12, -0.08, -0.04);
    accumulateBoneEuler(poseOffsets, "rightArm", -0.22, -0.3, -0.48);
    accumulateBoneEuler(poseOffsets, "rightForeArm", -0.54, -0.18, -0.4 - gesture);
    accumulateBoneEuler(poseOffsets, "rightHand", wrist * 0.28, 0, -wrist * 0.16);
    accumulateBoneEuler(poseOffsets, "spine2", 0.06, subtleTurn * 0.48, 0);
    accumulateBoneEuler(poseOffsets, "head", 0.03, subtleTurn * 1.75, 0);
  } else if (state === "thinking") {
    const wave = Math.sin(elapsed * 1.8);
    const hold = Math.abs(wave) < 0.3 ? Math.sign(wave || 1) * 0.28 : wave * 0.28;
    accumulateBoneEuler(poseOffsets, "head", 0.11, subtleTurn * 0.28, hold);
    accumulateBoneEuler(poseOffsets, "neck", 0.06, subtleTurn * 0.14, hold * 0.55);
    accumulateBoneEuler(poseOffsets, "spine2", 0.05, 0, hold * 0.22);
  } else if (state === "confused") {
    const wave = Math.sin(elapsed * 2.4);
    const tilt = (Math.abs(wave) < 0.28 ? Math.sign(wave || 1) * 0.33 : wave * 0.33) * (1 + cuePulse * 0.35);
    accumulateBoneEuler(poseOffsets, "head", 0.08, subtleTurn * 0.52, tilt);
    accumulateBoneEuler(poseOffsets, "neck", 0.03, subtleTurn * 0.24, tilt * 0.5);
  } else if (state === "celebrate") {
    const clapWave = Math.max(0, Math.sin(elapsed * 10.6)) * (0.48 + cuePulse * 0.5);
    accumulateBoneEuler(poseOffsets, "leftArm", -0.22, 0.2, 0.44 - clapWave * 0.5);
    accumulateBoneEuler(poseOffsets, "rightArm", -0.22, -0.2, -0.44 + clapWave * 0.5);
    accumulateBoneEuler(poseOffsets, "leftForeArm", -0.62, 0.08, 0.34 - clapWave * 0.55);
    accumulateBoneEuler(poseOffsets, "rightForeArm", -0.62, -0.08, -0.34 + clapWave * 0.55);
    accumulateBoneEuler(poseOffsets, "head", 0.04 + Math.sin(elapsed * 5.8) * 0.1, subtleTurn * 0.28, 0);
  } else if (state === "react_negative") {
    const shake = Math.sin(elapsed * 6.4) * 0.38;
    accumulateBoneEuler(poseOffsets, "head", 0.03, shake, 0);
    accumulateBoneEuler(poseOffsets, "neck", 0.01, shake * 0.42, 0);
    accumulateBoneEuler(poseOffsets, "spine2", -0.04, 0, 0);
  }

  (Object.entries(poseOffsets) as Array<[BoneKey, BoneEulerOffset]>).forEach(([key, offset]) => {
    blendBoneEuler(rig, basePose, key, new THREE.Euler(offset.x, offset.y, offset.z), boneLerp);
  });

  if (group) {
    const baseY = 0.1;
    const targetY =
      baseY + Math.sin(elapsed * 1.8) * 0.0024 + (state === "celebrate" ? Math.abs(Math.sin(elapsed * 7.8)) * 0.006 : 0);
    const targetZ = -0.12;
    const targetX = 0.007;
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, delta * 2.2);
    group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, delta * 2.2);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, delta * 2.2);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, delta * 2.2);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, delta * 2.2);
  }
}
