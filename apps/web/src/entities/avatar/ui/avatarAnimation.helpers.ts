import * as React from "react";
import * as THREE from "three";

export type BlinkState = {
  active: boolean;
  startAt: number;
  duration: number;
  nextAt: number;
};

export {
  type MorphBinding,
  type MorphKey,
  applyMorph,
  collectMorphBindings
} from "@/entities/avatar/ui/avatarMorph.helpers";

export {
  type BoneEulerOffset,
  type BoneEulerOffsets,
  type BoneKey,
  type BonePose,
  type BoneRig,
  type ModelFrame,
  accumulateBoneEuler,
  blendBoneEuler,
  collectBones,
  fitCameraToUpperBody,
  normalizeModel,
  requiredRigBones
} from "@/entities/avatar/ui/avatarRig.helpers";

export type TimeDomainDataBuffer = Parameters<AnalyserNode["getByteTimeDomainData"]>[0];

export function canUseWebGL() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(context);
  } catch {
    return false;
  }
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function toneDownHairSpecular(
  material: THREE.Material | undefined,
  meshName: string,
  enabled: boolean
) {
  if (!material) {
    return;
  }

  const isHairMaterial =
    material.name.toLowerCase().includes("hair") || meshName.toLowerCase().includes("hair");
  if (!isHairMaterial || !(material instanceof THREE.MeshStandardMaterial)) {
    return;
  }

  const base = material.userData.__imHairBase as
    | {
        roughness: number;
        metalness: number;
        envMapIntensity?: number;
        specularIntensity?: number;
      }
    | undefined;

  if (!base) {
    material.userData.__imHairBase = {
      roughness: material.roughness,
      metalness: material.metalness,
      envMapIntensity: material.envMapIntensity,
      specularIntensity: (material as THREE.MeshPhysicalMaterial).specularIntensity
    };
  }

  const resolvedBase = (material.userData.__imHairBase ?? {}) as Required<NonNullable<typeof base>>;
  if (!enabled) {
    material.roughness = resolvedBase.roughness;
    material.metalness = resolvedBase.metalness;
    if (typeof resolvedBase.envMapIntensity === "number") {
      material.envMapIntensity = resolvedBase.envMapIntensity;
    }
    if (
      typeof resolvedBase.specularIntensity === "number" &&
      material instanceof THREE.MeshPhysicalMaterial
    ) {
      material.specularIntensity = resolvedBase.specularIntensity;
    }
    material.needsUpdate = true;
    return;
  }

  material.metalness = resolvedBase.metalness * 0.5;
  if (typeof resolvedBase.envMapIntensity === "number") {
    material.envMapIntensity = resolvedBase.envMapIntensity * 0.5;
  }
  if (
    typeof resolvedBase.specularIntensity === "number" &&
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    material.specularIntensity = resolvedBase.specularIntensity * 0.5;
  }
  material.roughness = THREE.MathUtils.clamp(
    resolvedBase.roughness + (1 - resolvedBase.roughness) * 0.35,
    0,
    1
  );
  material.needsUpdate = true;
}

export function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function smoothFactor(rate: number, delta: number) {
  return 1 - Math.exp(-rate * delta);
}

export function readAudioAmplitude(
  analyserRef: React.MutableRefObject<AnalyserNode | null>,
  dataRef: React.MutableRefObject<TimeDomainDataBuffer | null>,
  audioRef?: React.RefObject<HTMLAudioElement>
) {
  const analyser = analyserRef.current;
  const data = dataRef.current;
  const audioElement = audioRef?.current;

  if (!analyser || !data || !audioElement || audioElement.paused) {
    return 0;
  }

  analyser.getByteTimeDomainData(data);

  let squareSum = 0;
  for (let index = 0; index < data.length; index += 1) {
    const centered = (data[index] - 128) / 128;
    squareSum += centered * centered;
  }

  const rms = Math.sqrt(squareSum / data.length);
  return clamp01(rms * 3.2);
}
