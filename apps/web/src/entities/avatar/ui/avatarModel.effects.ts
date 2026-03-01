import * as React from "react";
import * as THREE from "three";
import {
  collectBones,
  collectMorphBindings,
  fitCameraToUpperBody,
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
import type { AvatarModelCharacter } from "@/entities/avatar/ui/avatarModelNode";

type UseAvatarModelEffectsOptions = {
  character: AvatarModelCharacter;
  modelScene: THREE.Group;
  modelUrl: string;
  debugMorph: boolean;
  camera: THREE.Camera;
  audioRef?: React.RefObject<HTMLAudioElement>;
  cueToken: number;
  morphBindingsRef: React.MutableRefObject<MorphBinding[]>;
  boneRigRef: React.MutableRefObject<BoneRig>;
  boneBasePoseRef: React.MutableRefObject<Partial<Record<BoneKey, BonePose>>>;
  missingBoneWarnedRef: React.MutableRefObject<boolean>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  analyserDataRef: React.MutableRefObject<TimeDomainDataBuffer | null>;
  lastCueTokenRef: React.MutableRefObject<number>;
  cuePulseRef: React.MutableRefObject<number>;
  modelFrameRef: React.MutableRefObject<ModelFrame | null>;
};

export function useAvatarModelEffects({
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
}: UseAvatarModelEffectsOptions) {
  React.useEffect(() => {
    morphBindingsRef.current = collectMorphBindings(modelScene, debugMorph);
  }, [debugMorph, modelScene, morphBindingsRef]);

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
  }, [boneBasePoseRef, boneRigRef, character, missingBoneWarnedRef, modelScene, modelUrl]);

  React.useEffect(() => {
    const modelFrame = modelFrameRef.current;
    if (!modelFrame) {
      return;
    }
    fitCameraToUpperBody(camera, modelFrame);
  }, [camera, modelFrameRef, modelScene]);

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
  }, [audioRef, analyserDataRef, analyserRef]);

  React.useEffect(() => {
    if (cueToken === lastCueTokenRef.current) {
      return;
    }
    lastCueTokenRef.current = cueToken;
    cuePulseRef.current = 1;
  }, [cuePulseRef, cueToken, lastCueTokenRef]);
}
