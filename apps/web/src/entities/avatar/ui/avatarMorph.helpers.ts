import * as THREE from "three";

export type MorphKey = "mouthOpen" | "smile" | "frown" | "browUp" | "blink";

export type MorphBinding = {
  influences: number[];
  indexByKey: Partial<Record<MorphKey, number[]>>;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
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
