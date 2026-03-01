import * as React from "react";
import * as THREE from "three";

export type MorphKey = "mouthOpen" | "smile" | "frown" | "browUp" | "blink";

export type MorphBinding = {
  influences: number[];
  indexByKey: Partial<Record<MorphKey, number[]>>;
};

export type BlinkState = {
  active: boolean;
  startAt: number;
  duration: number;
  nextAt: number;
};

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

function normalizeMorphName(name: string) {
  return name.toLowerCase().replace(/[\s_-]+/g, "");
}

function findMorphIndexes(dictionary: Record<string, number>, candidates: string[]) {
  const entries = Object.entries(dictionary).map(([name, index]) => ({
    name,
    index,
    normalized: normalizeMorphName(name)
  }));
  const indexes: number[] = [];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeMorphName(candidate);
    const exact = entries.find((entry) => entry.normalized === normalizedCandidate);
    const partial = entries.find((entry) => entry.normalized.includes(normalizedCandidate));
    const resolvedIndex = exact?.index ?? partial?.index;

    if (typeof resolvedIndex === "number" && !indexes.includes(resolvedIndex)) {
      indexes.push(resolvedIndex);
    }
  }

  return indexes;
}

export function collectMorphBindings(scene: THREE.Object3D, debugMorph: boolean) {
  const bindings: MorphBinding[] = [];
  const allKeys = new Set<string>();

  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    const dictionary = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;

    if (!dictionary || !influences) {
      return;
    }

    Object.keys(dictionary).forEach((key) => allKeys.add(key));

    const mouthOpenIndexes = findMorphIndexes(dictionary, [
      "jawOpen",
      "mouthOpen",
      "viseme_aa",
      "viseme_oh",
      "viseme_ou"
    ]);
    const blinkIndexes = findMorphIndexes(dictionary, ["eyeBlinkLeft", "eyeBlinkRight"]);
    const smileIndexes = findMorphIndexes(dictionary, ["mouthSmileLeft", "mouthSmileRight"]);
    const frownIndexes = findMorphIndexes(dictionary, ["mouthFrownLeft", "mouthFrownRight"]);

    const indexByKey: Partial<Record<MorphKey, number[]>> = {
      mouthOpen: mouthOpenIndexes,
      blink: blinkIndexes.length > 0 ? blinkIndexes : findMorphIndexes(dictionary, ["blink"]),
      smile: smileIndexes.length > 0 ? smileIndexes : findMorphIndexes(dictionary, ["smile"]),
      frown: frownIndexes.length > 0 ? frownIndexes : findMorphIndexes(dictionary, ["frown"]),
      browUp: findMorphIndexes(dictionary, ["browInnerUp", "browUp"])
    };

    bindings.push({
      influences,
      indexByKey
    });
  });

  if (debugMorph) {
    console.info("[InterviewerAvatarAnimated] morph keys:", [...allKeys]);
    const visemeKeys = [...allKeys].filter((key) => key.toLowerCase().includes("viseme"));
    if (visemeKeys.length > 0) {
      console.info("[InterviewerAvatarAnimated] viseme keys:", visemeKeys);
    }
  }

  return bindings;
}

export function applyMorph(binding: MorphBinding, key: MorphKey, value: number, smoothing = 0.2) {
  const indexes = binding.indexByKey[key];
  if (!indexes || indexes.length === 0) {
    return;
  }

  for (const index of indexes) {
    const current = binding.influences[index] ?? 0;
    binding.influences[index] = THREE.MathUtils.lerp(current, clamp01(value), smoothing);
  }
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
