"use client";

import * as React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import {
  normalizeModel,
  randomInRange,
  type BlinkState,
  type BoneKey,
  type BonePose,
  type BoneRig,
  type ModelFrame,
  type MorphBinding,
  type TimeDomainDataBuffer
} from "@/entities/avatar/ui/avatarAnimation.helpers";
import { animateAvatarFrame } from "@/entities/avatar/ui/avatarAnimationFrame";
import { useAvatarModelEffects } from "@/entities/avatar/ui/avatarModel.effects";

export type AvatarModelCharacter = "zet" | "luna" | "iron";
export type AvatarModelEmotion = "neutral" | "encourage" | "pressure";

export type AvatarModelProps = {
  character: AvatarModelCharacter;
  modelUrl: string;
  state: AvatarState;
  cueToken: number;
  emotion: AvatarModelEmotion;
  reactionEnabled: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  debugMorph: boolean;
};

export function AvatarModel({
  character,
  modelUrl,
  state,
  cueToken,
  emotion,
  reactionEnabled,
  audioRef,
  debugMorph
}: AvatarModelProps) {
  const { camera } = useThree();
  const modelFrameRef = React.useRef<ModelFrame | null>(null);
  const gltf = useGLTF(modelUrl) as { scene: THREE.Group };
  const modelScene = React.useMemo(() => {
    const cloned = gltf.scene.clone(true);
    modelFrameRef.current = normalizeModel(cloned);
    return cloned;
  }, [gltf.scene]);
  const morphBindingsRef = React.useRef<MorphBinding[]>([]);
  const rootGroupRef = React.useRef<THREE.Group | null>(null);
  const boneRigRef = React.useRef<BoneRig>({});
  const boneBasePoseRef = React.useRef<Partial<Record<BoneKey, BonePose>>>({});
  const missingBoneWarnedRef = React.useRef(false);
  const mouthEnvelopeRef = React.useRef(0);
  const cuePulseRef = React.useRef(0);
  const lastCueTokenRef = React.useRef(cueToken);
  const blinkStateRef = React.useRef<BlinkState>({
    active: false,
    startAt: 0,
    duration: 0.14,
    nextAt: randomInRange(3.0, 6.0)
  });

  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const analyserDataRef = React.useRef<TimeDomainDataBuffer | null>(null);

  useAvatarModelEffects({
    character,
    modelScene,
    modelUrl,
    debugMorph,
    camera,
    audioRef,
    cueToken,
    morphBindingsRef,
    boneRigRef,
    boneBasePoseRef,
    missingBoneWarnedRef,
    analyserRef,
    analyserDataRef,
    lastCueTokenRef,
    cuePulseRef,
    modelFrameRef
  });

  useFrame(({ clock }, delta) => {
    animateAvatarFrame({
      elapsed: clock.getElapsedTime(),
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
    });
  });

  return (
    <group ref={rootGroupRef}>
      <primitive object={modelScene} />
    </group>
  );
}
