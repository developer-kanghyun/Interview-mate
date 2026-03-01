"use client";

import * as React from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import {
  collectBones,
  collectMorphBindings,
  fitCameraToUpperBody,
  normalizeModel,
  randomInRange,
  requiredRigBones,
  toneDownHairSpecular,
  type BlinkState,
  type BoneKey,
  type BonePose,
  type BoneRig,
  type ModelFrame,
  type MorphBinding,
  type TimeDomainDataBuffer
} from "@/entities/avatar/ui/avatarAnimation.helpers";
import { animateAvatarFrame } from "@/entities/avatar/ui/avatarAnimationFrame";

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

  React.useEffect(() => {
    const bindings = collectMorphBindings(modelScene, debugMorph);
    morphBindingsRef.current = bindings;
  }, [debugMorph, modelScene]);

  React.useEffect(() => {
    const shouldToneDownHair = character === "zet" || character === "iron";
    modelScene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) {
        return;
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        toneDownHairSpecular(material, mesh.name, shouldToneDownHair);
      }
    });
    const { rig, basePose } = collectBones(modelScene);
    boneRigRef.current = rig;
    boneBasePoseRef.current = basePose;

    const missingBones = requiredRigBones.filter((boneKey) => !rig[boneKey]);
    if (missingBones.length > 0 && !missingBoneWarnedRef.current) {
      missingBoneWarnedRef.current = true;
      console.warn("[InterviewerAvatarAnimated] missing rig bones:", {
        character,
        modelUrl,
        missingBones
      });
    }
  }, [character, modelScene, modelUrl]);

  React.useEffect(() => {
    const modelFrame = modelFrameRef.current;
    if (!modelFrame) {
      return;
    }
    fitCameraToUpperBody(camera, modelFrame);
  }, [camera, modelScene]);

  React.useEffect(() => {
    const audioElement = audioRef?.current;
    if (!audioElement) {
      return;
    }

    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    let source: MediaElementAudioSourceNode | null = null;
    try {
      source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      analyserRef.current = analyser;
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount) as TimeDomainDataBuffer;
    } catch {
      analyserRef.current = null;
      analyserDataRef.current = null;
    }

    const handlePlay = () => {
      if (audioContext.state === "suspended") {
        void audioContext.resume();
      }
    };

    audioElement.addEventListener("play", handlePlay);

    return () => {
      audioElement.removeEventListener("play", handlePlay);
      if (source) {
        source.disconnect();
      }
      analyser.disconnect();
      void audioContext.close();
      analyserRef.current = null;
      analyserDataRef.current = null;
    };
  }, [audioRef]);

  React.useEffect(() => {
    if (cueToken === lastCueTokenRef.current) {
      return;
    }
    lastCueTokenRef.current = cueToken;
    cuePulseRef.current = 1;
  }, [cueToken]);

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
