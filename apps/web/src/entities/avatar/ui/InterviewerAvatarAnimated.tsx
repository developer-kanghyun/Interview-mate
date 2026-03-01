"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import { AVATAR_RELAX_POSE_CALIBRATION } from "@/entities/avatar/model/avatarPoseCalibration";
import { AVATAR_GLB_BY_CHARACTER } from "@/shared/config/avatarAssets";
import {
  AvatarStage,
  DebugSceneHelpers,
  FallbackAvatar,
  WebglUnavailableAvatar
} from "@/entities/avatar/ui/avatarSceneComponents";

export type AvatarCharacter = "zet" | "luna" | "iron";
export type AvatarEmotion = "neutral" | "encourage" | "pressure";
export type AvatarStageVariant = "clean_office" | "minimal";

type InterviewerAvatarAnimatedProps = {
  character: AvatarCharacter;
  state: AvatarState;
  emotion: AvatarEmotion;
  cueToken?: number;
  reactionEnabled?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  debugMorph?: boolean;
  debugScene?: boolean;
  stageVariant?: AvatarStageVariant;
  cameraZoom?: number;
};

type MorphKey = "mouthOpen" | "smile" | "frown" | "browUp" | "blink";

type MorphBinding = {
  influences: number[];
  indexByKey: Partial<Record<MorphKey, number[]>>;
};

type BlinkState = {
  active: boolean;
  startAt: number;
  duration: number;
  nextAt: number;
};

type ModelFrame = {
  fullHeight: number;
  headY: number;
  chestY: number;
};

type BoneKey =
  | "hips"
  | "spine"
  | "spine1"
  | "spine2"
  | "neck"
  | "head"
  | "leftShoulder"
  | "leftArm"
  | "leftForeArm"
  | "leftHand"
  | "rightShoulder"
  | "rightArm"
  | "rightForeArm"
  | "rightHand"
  | "leftEye"
  | "rightEye";

type BoneRig = Partial<Record<BoneKey, THREE.Bone>>;

type BonePose = {
  quaternion: THREE.Quaternion;
  position: THREE.Vector3;
};

type BoneEulerOffset = {
  x: number;
  y: number;
  z: number;
};

type BoneEulerOffsets = Partial<Record<BoneKey, BoneEulerOffset>>;

const modelUrlByCharacter: Record<AvatarCharacter, string> = AVATAR_GLB_BY_CHARACTER;
const requiredRigBones: BoneKey[] = [
  "head",
  "neck",
  "spine",
  "spine1",
  "spine2",
  "leftShoulder",
  "rightShoulder",
  "leftArm",
  "rightArm",
  "leftForeArm",
  "rightForeArm"
];

const boneNameCandidates: Record<BoneKey, string[]> = {
  hips: ["Hips", "mixamorigHips", "Armature_Hips"],
  spine: ["Spine", "mixamorigSpine"],
  spine1: ["Spine1", "mixamorigSpine1"],
  spine2: ["Spine2", "mixamorigSpine2", "Chest", "mixamorigChest"],
  neck: ["Neck", "mixamorigNeck"],
  head: ["Head", "mixamorigHead"],
  leftShoulder: ["LeftShoulder", "mixamorigLeftShoulder", "Shoulder_L"],
  leftArm: ["LeftArm", "mixamorigLeftArm", "UpperArm_L"],
  leftForeArm: ["LeftForeArm", "mixamorigLeftForeArm", "LowerArm_L"],
  leftHand: ["LeftHand", "mixamorigLeftHand", "Hand_L"],
  rightShoulder: ["RightShoulder", "mixamorigRightShoulder", "Shoulder_R"],
  rightArm: ["RightArm", "mixamorigRightArm", "UpperArm_R"],
  rightForeArm: ["RightForeArm", "mixamorigRightForeArm", "LowerArm_R"],
  rightHand: ["RightHand", "mixamorigRightHand", "Hand_R"],
  leftEye: ["LeftEye", "mixamorigLeftEye", "Eye_L"],
  rightEye: ["RightEye", "mixamorigRightEye", "Eye_R"]
};

useGLTF.preload(AVATAR_GLB_BY_CHARACTER.luna);
useGLTF.preload(AVATAR_GLB_BY_CHARACTER.zet);
useGLTF.preload(AVATAR_GLB_BY_CHARACTER.iron);

function canUseWebGL() {
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

function normalizeModel(modelRoot: THREE.Object3D, targetHeight = 1.72): ModelFrame | null {
  const initialBounds = new THREE.Box3().setFromObject(modelRoot);
  if (initialBounds.isEmpty()) {
    return null;
  }

  const initialSize = new THREE.Vector3();
  initialBounds.getSize(initialSize);

  if (initialSize.y <= 0) {
    return null;
  }

  const scale = targetHeight / initialSize.y;
  modelRoot.scale.multiplyScalar(scale);

  const centeredBounds = new THREE.Box3().setFromObject(modelRoot);
  const centered = new THREE.Vector3();
  centeredBounds.getCenter(centered);

  modelRoot.position.x -= centered.x;
  modelRoot.position.z -= centered.z;

  const flooredBounds = new THREE.Box3().setFromObject(modelRoot);
  modelRoot.position.y -= flooredBounds.min.y;

  const finalBounds = new THREE.Box3().setFromObject(modelRoot);
  const finalSize = new THREE.Vector3();
  finalBounds.getSize(finalSize);

  return {
    fullHeight: finalSize.y,
    headY: finalBounds.max.y,
    chestY: finalBounds.min.y + finalSize.y * 0.58
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toneDownHairSpecular(
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

  const resolvedBase = (material.userData.__imHairBase ??
    {}) as Required<NonNullable<typeof base>>;
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

  // Shine perception ~= env/metal/specular. Half those terms, then raise roughness mildly.
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

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function smoothFactor(rate: number, delta: number) {
  return 1 - Math.exp(-rate * delta);
}

function collectBones(scene: THREE.Object3D) {
  const byName = new Map<string, THREE.Bone>();
  scene.traverse((object) => {
    if (object.type === "Bone") {
      byName.set(object.name.toLowerCase(), object as THREE.Bone);
    }
  });

  const rig: BoneRig = {};
  const basePose: Partial<Record<BoneKey, BonePose>> = {};

  (Object.keys(boneNameCandidates) as BoneKey[]).forEach((key) => {
    const candidates = boneNameCandidates[key];
    const matchedName = candidates.find((candidate) => byName.has(candidate.toLowerCase()));
    if (!matchedName) {
      return;
    }

    const bone = byName.get(matchedName.toLowerCase());
    if (!bone) {
      return;
    }

    rig[key] = bone;
    basePose[key] = {
      quaternion: bone.quaternion.clone(),
      position: bone.position.clone()
    };
  });

  return { rig, basePose };
}

function blendBoneEuler(
  rig: BoneRig,
  basePose: Partial<Record<BoneKey, BonePose>>,
  key: BoneKey,
  euler: THREE.Euler,
  lerpFactor: number
) {
  const bone = rig[key];
  const base = basePose[key];
  if (!bone || !base) {
    return;
  }

  const targetQuaternion = base.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(euler));
  bone.quaternion.slerp(targetQuaternion, lerpFactor);
}

function accumulateBoneEuler(
  offsets: BoneEulerOffsets,
  key: BoneKey,
  x: number,
  y: number,
  z: number,
  weight = 1
) {
  const current = offsets[key] ?? { x: 0, y: 0, z: 0 };
  current.x += x * weight;
  current.y += y * weight;
  current.z += z * weight;
  offsets[key] = current;
}

function fitCameraToUpperBody(camera: THREE.Camera, frame: ModelFrame) {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  camera.fov = 23;

  // Keep a stable "product shot" camera while nudging for model headroom consistency.
  const baseLookY = 1.58;
  const baseCameraY = 1.72;
  const baseCameraZ = 1.36;
  const targetHeadY = 1.67;
  const headDelta = THREE.MathUtils.clamp(frame.headY - targetHeadY, -0.18, 0.18);

  camera.position.set(0, baseCameraY + headDelta * 0.12, baseCameraZ + headDelta * 0.12);
  camera.lookAt(0, baseLookY + headDelta * 0.05, 0);
  camera.updateProjectionMatrix();
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

function collectMorphBindings(scene: THREE.Object3D, debugMorph: boolean) {
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
    // debugMorph 옵션으로 모델 morph key를 확인합니다.
    console.info("[InterviewerAvatarAnimated] morph keys:", [...allKeys]);
    const visemeKeys = [...allKeys].filter((key) => key.toLowerCase().includes("viseme"));
    if (visemeKeys.length > 0) {
      console.info("[InterviewerAvatarAnimated] viseme keys:", visemeKeys);
    }
  }

  return bindings;
}

function applyMorph(binding: MorphBinding, key: MorphKey, value: number, smoothing = 0.2) {
  const indexes = binding.indexByKey[key];
  if (!indexes || indexes.length === 0) {
    return;
  }

  for (const index of indexes) {
    const current = binding.influences[index] ?? 0;
    binding.influences[index] = THREE.MathUtils.lerp(current, clamp01(value), smoothing);
  }
}

type TimeDomainDataBuffer = Parameters<AnalyserNode["getByteTimeDomainData"]>[0];

function readAudioAmplitude(
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

type AvatarModelProps = {
  character: AvatarCharacter;
  modelUrl: string;
  state: AvatarState;
  cueToken: number;
  emotion: AvatarEmotion;
  reactionEnabled: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  debugMorph: boolean;
};

function AvatarModel({ character, modelUrl, state, cueToken, emotion, reactionEnabled, audioRef, debugMorph }: AvatarModelProps) {
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
    const elapsed = clock.getElapsedTime();
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
      const idleMouthGain = state === "asking" ? 0.58 : state === "celebrate" ? 0.32 : state === "listening" ? 0.05 : 0.045;
      const speakingGain = state === "asking" ? 1 : state === "celebrate" ? 0.52 : state === "listening" ? 0.12 : 0.09;
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

    // Apply per-character relaxed arm baseline first (RPM local axes vary by avatar).
    (Object.entries(relaxCalibration) as Array<[keyof typeof relaxCalibration, (typeof relaxCalibration)[keyof typeof relaxCalibration]]>).forEach(
      ([key, offset]) => {
        if (!offset) {
          return;
        }
        accumulateBoneEuler(poseOffsets, key as BoneKey, offset.x, offset.y, offset.z);
      }
    );

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
      const targetY = baseY + Math.sin(elapsed * 1.8) * 0.0024 + (state === "celebrate" ? Math.abs(Math.sin(elapsed * 7.8)) * 0.006 : 0);
      const targetZ = -0.12;
      const targetX = 0.007;
      group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, delta * 2.2);
      group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, delta * 2.2);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, delta * 2.2);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, delta * 2.2);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, delta * 2.2);
    }
  });

  return (
    <group ref={rootGroupRef}>
      <primitive object={modelScene} />
    </group>
  );
}

type SceneErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type SceneErrorBoundaryState = {
  hasError: boolean;
};

class SceneErrorBoundary extends React.Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  public state: SceneErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }

  public componentDidCatch(error: Error) {
    console.warn("[InterviewerAvatarAnimated] GLB load/render fallback:", error.message);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function InterviewerAvatarAnimated({
  character,
  state,
  emotion,
  cueToken = 0,
  reactionEnabled = true,
  audioRef,
  debugMorph = false,
  debugScene = false,
  stageVariant = "clean_office",
  cameraZoom = 1
}: InterviewerAvatarAnimatedProps) {
  const webglAvailable = React.useMemo(() => canUseWebGL(), []);
  const modelUrl = modelUrlByCharacter[character];

  if (!webglAvailable) {
    return (
      <div className="h-full w-full" data-avatar-state={state} data-avatar-cue={cueToken}>
        <WebglUnavailableAvatar state={state} emotion={emotion} />
      </div>
    );
  }

  return (
    <div className="h-full w-full" data-avatar-state={state} data-avatar-cue={cueToken}>
      <Canvas dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }} shadows camera={{ position: [0, 1.72, 1.36], fov: 23, zoom: cameraZoom }}>
        <hemisphereLight intensity={0.46} color="#ffffff" groundColor="#dde5f0" />
        <ambientLight intensity={0.56} />
        <directionalLight castShadow intensity={0.8} position={[2.2, 3.0, 2.2]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight intensity={0.28} position={[-1.5, 2.1, -1.1]} />
        <spotLight position={[0.25, 3.0, 1.45]} angle={0.44} penumbra={0.78} intensity={0.2} />

        <AvatarStage variant={stageVariant} />
        {debugScene ? <DebugSceneHelpers /> : null}

        <SceneErrorBoundary key={modelUrl} fallback={<FallbackAvatar state={state} emotion={emotion} />}>
          <React.Suspense fallback={<FallbackAvatar state={state} emotion={emotion} />}>
            <AvatarModel
              character={character}
              modelUrl={modelUrl}
              state={state}
              cueToken={cueToken}
              emotion={emotion}
              reactionEnabled={reactionEnabled}
              audioRef={audioRef}
              debugMorph={debugMorph}
            />
          </React.Suspense>
        </SceneErrorBoundary>

        <Environment preset="studio" background={false} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.23} blur={2.5} scale={6.4} far={4.4} />
        <OrbitControls target={[0, 1.58, 0]} enablePan={false} enableRotate={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
