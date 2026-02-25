"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

export type AvatarCharacter = "zet" | "luna" | "iron";
export type AvatarEmotion = "neutral" | "encourage" | "pressure";

type InterviewerAvatarAnimatedProps = {
  character: AvatarCharacter;
  state: AvatarState;
  emotion: AvatarEmotion;
  cueToken?: number;
  reactionEnabled?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  debugMorph?: boolean;
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

const RPM_ZET_URL = "https://models.readyplayer.me/699e4f524d98c76821a813f9.glb";
const RPM_LUNA_URL = "https://models.readyplayer.me/699e4ec95f0ce8d1169f9137.glb";
const RPM_IRON_URL = "https://models.readyplayer.me/699e59acdea6e53d0cf3052e.glb";

const modelUrlByCharacter: Record<AvatarCharacter, string> = {
  zet: RPM_ZET_URL,
  luna: RPM_LUNA_URL,
  iron: RPM_IRON_URL
};

const localModelUrlByCharacter: Record<AvatarCharacter, string> = {
  zet: "/models/zet.glb",
  luna: "/models/luna.glb",
  iron: "/models/iron.glb"
};

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

function isLikelyBinaryModelContentType(contentType: string | null) {
  if (!contentType) {
    return false;
  }
  const normalized = contentType.toLowerCase();
  return normalized.includes("model/gltf-binary") || normalized.includes("application/octet-stream") || normalized.includes("binary");
}

function normalizeModel(modelRoot: THREE.Object3D, targetHeight = 2.25) {
  const initialBounds = new THREE.Box3().setFromObject(modelRoot);
  if (initialBounds.isEmpty()) {
    return;
  }

  const initialSize = new THREE.Vector3();
  const initialCenter = new THREE.Vector3();
  initialBounds.getSize(initialSize);
  initialBounds.getCenter(initialCenter);

  if (initialSize.y <= 0) {
    return;
  }

  const scale = targetHeight / initialSize.y;
  modelRoot.scale.multiplyScalar(scale);

  const scaledBounds = new THREE.Box3().setFromObject(modelRoot);
  const scaledCenter = new THREE.Vector3();
  scaledBounds.getCenter(scaledCenter);

  modelRoot.position.x -= scaledCenter.x;
  modelRoot.position.z -= scaledCenter.z;
  modelRoot.position.y -= scaledBounds.min.y;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function smoothFactor(rate: number, delta: number) {
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

function readAudioAmplitude(
  analyserRef: React.MutableRefObject<AnalyserNode | null>,
  dataRef: React.MutableRefObject<Uint8Array | null>,
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

type FallbackAvatarProps = {
  state: AvatarState;
  emotion: AvatarEmotion;
};

function FallbackAvatar({ state, emotion }: FallbackAvatarProps) {
  const groupRef = React.useRef<THREE.Group | null>(null);
  const bustRef = React.useRef<THREE.Group | null>(null);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    const group = groupRef.current;
    const bust = bustRef.current;

    if (group) {
      const bob = state === "asking" ? Math.sin(elapsed * 4.8) * 0.012 : state === "listening" ? Math.sin(elapsed * 2.9) * 0.008 : 0;
      const targetY = -0.08 + bob;
      const targetX = state === "thinking" ? 0.18 : state === "listening" ? Math.sin(elapsed * 2.4) * 0.045 : 0.08;
      const targetYRot = state === "asking" ? Math.sin(elapsed * 1.4) * 0.045 : 0;

      group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, delta * 1.8);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, delta * 1.8);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetYRot, delta * 1.8);
    }

    if (bust) {
      const scaleBoost = state === "celebrate" ? 1.05 : state === "react_negative" ? 0.95 : 1;
      const pulse = state === "asking" ? 1 + Math.sin(elapsed * 7.2) * 0.012 : 1;
      const tiltZ = state === "confused" ? Math.sin(elapsed * 5.6) * 0.08 : 0;
      bust.rotation.z = THREE.MathUtils.lerp(bust.rotation.z, tiltZ, delta * 2.4);
      bust.scale.setScalar(THREE.MathUtils.lerp(bust.scale.x, scaleBoost * pulse, delta * 3));
    }
  });

  const accentColor = React.useMemo(() => {
    if (emotion === "pressure") {
      return "#ef4444";
    }
    if (emotion === "encourage") {
      return "#34d399";
    }
    return "#60a5fa";
  }, [emotion]);

  return (
    <group ref={groupRef}>
      <group ref={bustRef} position={[0, 0.02, -0.14]}>
        <mesh position={[0, 1.18, 0]} castShadow>
          <sphereGeometry args={[0.2, 28, 28]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.72} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.97, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.12, 18]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.72} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.66, -0.01]} castShadow>
          <capsuleGeometry args={[0.22, 0.46, 8, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.56} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.78, 0.02]} castShadow>
          <boxGeometry args={[0.58, 0.1, 0.2]} />
          <meshStandardMaterial color={accentColor} roughness={0.45} metalness={0.08} />
        </mesh>
        <mesh position={[-0.34, 0.72, 0]} castShadow rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.06, 0.26, 8, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.58} metalness={0.08} />
        </mesh>
        <mesh position={[0.34, 0.72, 0]} castShadow rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.06, 0.26, 8, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.58} metalness={0.08} />
        </mesh>
      </group>
    </group>
  );
}

function OfficeStage() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#fff4ec" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh position={[0, 2.35, -3.7]} receiveShadow>
        <boxGeometry args={[12, 4.8, 0.18]} />
        <meshStandardMaterial color="#ffe8d6" roughness={0.9} metalness={0.04} />
      </mesh>

      <mesh position={[0, 1.8, -3.58]}>
        <planeGeometry args={[5.8, 2.2]} />
        <meshStandardMaterial color="#ffd4b8" roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
}

function WebglUnavailableAvatar({ state, emotion }: { state: AvatarState; emotion: AvatarEmotion }) {
  const ringColor = emotion === "encourage" ? "ring-emerald-300" : emotion === "pressure" ? "ring-rose-300" : "ring-im-primary/30";
  const badgeText =
    state === "asking"
      ? "질문 중"
      : state === "listening"
        ? "경청 중"
        : state === "thinking"
          ? "분석 중"
          : state === "confused"
            ? "재질문"
            : state === "celebrate"
              ? "긍정 반응"
              : "대기";

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#fffaf6_0%,#fff4ec_100%)]">
      <div className={`flex h-44 w-44 items-center justify-center rounded-full bg-white text-5xl shadow-soft ring-4 ${ringColor}`}>
        🙂
      </div>
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-im-border bg-white/90 px-3 py-1 text-xs font-semibold text-im-text-main">
        {badgeText}
      </span>
    </div>
  );
}

type AvatarModelProps = {
  modelUrl: string;
  state: AvatarState;
  cueToken: number;
  emotion: AvatarEmotion;
  reactionEnabled: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  debugMorph: boolean;
};

function AvatarModel({ modelUrl, state, cueToken, emotion, reactionEnabled, audioRef, debugMorph }: AvatarModelProps) {
  const gltf = useGLTF(modelUrl) as { scene: THREE.Group };
  const modelScene = React.useMemo(() => {
    const cloned = gltf.scene.clone(true);
    normalizeModel(cloned);
    return cloned;
  }, [gltf.scene]);
  const morphBindingsRef = React.useRef<MorphBinding[]>([]);
  const rootGroupRef = React.useRef<THREE.Group | null>(null);
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
  const analyserDataRef = React.useRef<Uint8Array | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);

  React.useEffect(() => {
    const bindings = collectMorphBindings(modelScene, debugMorph);
    morphBindingsRef.current = bindings;
  }, [debugMorph, modelScene]);

  React.useEffect(() => {
    modelScene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) {
        return;
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [modelScene]);

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
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      audioContextRef.current = audioContext;
    } catch {
      analyserRef.current = null;
      analyserDataRef.current = null;
      audioContextRef.current = null;
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
      audioContextRef.current = null;
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
    const hasMorphBindings = morphBindingsRef.current.length > 0;
    cuePulseRef.current = Math.max(0, cuePulseRef.current - delta * 1.9);
    const cuePulse = cuePulseRef.current;

    if (hasMorphBindings) {
      const audioAmplitude = readAudioAmplitude(analyserRef, analyserDataRef, audioRef);
      const audioElement = audioRef?.current;
      const isAudioPlaying = Boolean(audioElement && !audioElement.paused && !audioElement.ended);
      const silenceGate = 0.02;
      const gatedAmplitude = Math.max(0, audioAmplitude - silenceGate);
      const audioTarget = clamp01(gatedAmplitude * 1.42 + Math.max(0, Math.sin(elapsed * 18)) * 0.04);
      const fakeLipSync =
        state === "asking"
          ? clamp01((Math.sin(elapsed * 8.2) + 1) * 0.16 + (Math.sin(elapsed * 14.6) + 1) * 0.06)
          : 0;
      const idleMouthGain = state === "asking" ? 1 : state === "celebrate" ? 0.9 : state === "listening" ? 0.18 : 0.12;
      const targetMouth = isAudioPlaying ? audioTarget : fakeLipSync * idleMouthGain;
      const isOpeningMouth = targetMouth > mouthEnvelopeRef.current;
      const smoothing = smoothFactor(isOpeningMouth ? 20 : 7, delta);
      mouthEnvelopeRef.current = THREE.MathUtils.lerp(mouthEnvelopeRef.current, targetMouth, smoothing);

      let mouthOpen = mouthEnvelopeRef.current;
      if (isAudioPlaying && mouthOpen < 0.025) {
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

    if (group) {
      const seatedBaseY = -0.1;
      const seatedBaseZ = -0.16;
      const seatedLeanX = 0.09;
      const askingBob = state === "asking" ? Math.sin(elapsed * 5.4) * 0.009 : 0;
      const listeningNod = state === "listening" ? Math.sin(elapsed * 2.8) * 0.03 : 0;
      const confusedTilt = state === "confused" ? Math.sin(elapsed * 6.2) * (0.05 + cuePulse * 0.03) : 0;
      const celebrateBounce = state === "celebrate" ? Math.abs(Math.sin(elapsed * 8.2)) * (0.012 + cuePulse * 0.01) : 0;
      const celebrateSwing = state === "celebrate" ? Math.sin(elapsed * 5.6) * (0.04 + cuePulse * 0.02) : 0;
      const targetPosY = seatedBaseY + (state === "thinking" ? -0.01 : 0) + askingBob + celebrateBounce;
      const targetPosZ = seatedBaseZ + (state === "thinking" ? -0.01 : 0);
      const targetRotX = seatedLeanX + (state === "thinking" ? 0.07 : listeningNod);
      const targetRotY = state === "asking" ? Math.sin(elapsed * 1.3) * 0.03 : confusedTilt + celebrateSwing;
      const targetRotZ = state === "confused" ? Math.sin(elapsed * 3.8) * 0.08 : state === "celebrate" ? Math.sin(elapsed * 7.2) * 0.03 : 0;

      group.position.y = THREE.MathUtils.lerp(group.position.y, targetPosY, delta * 1.5);
      group.position.z = THREE.MathUtils.lerp(group.position.z, targetPosZ, delta * 1.5);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, delta * 1.5);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, delta * 1.5);
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, delta * 1.5);
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
  debugMorph = false
}: InterviewerAvatarAnimatedProps) {
  const webglAvailable = React.useMemo(() => canUseWebGL(), []);
  const primaryModelUrl = modelUrlByCharacter[character];
  const fallbackModelUrl = localModelUrlByCharacter[character];
  const [activeModelUrl, setActiveModelUrl] = React.useState(primaryModelUrl);

  React.useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => abortController.abort(), 3200);

    setActiveModelUrl(primaryModelUrl);

    const verifyPrimaryModel = async () => {
      if (!primaryModelUrl || primaryModelUrl.startsWith("/")) {
        return;
      }

      try {
        const response = await fetch(primaryModelUrl, {
          method: "HEAD",
          cache: "no-store",
          signal: abortController.signal
        });

        const looksValid = response.ok && isLikelyBinaryModelContentType(response.headers.get("content-type"));
        if (!looksValid && !cancelled) {
          setActiveModelUrl(fallbackModelUrl);
        }
      } catch {
        if (!cancelled) {
          setActiveModelUrl(fallbackModelUrl);
        }
      }
    };

    void verifyPrimaryModel();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [fallbackModelUrl, primaryModelUrl]);

  if (!webglAvailable) {
    return (
      <div className="h-full w-full" data-avatar-state={state} data-avatar-cue={cueToken}>
        <WebglUnavailableAvatar state={state} emotion={emotion} />
      </div>
    );
  }

  return (
    <div className="h-full w-full" data-avatar-state={state} data-avatar-cue={cueToken}>
      <Canvas dpr={[1, 1.75]} gl={{ alpha: true }} shadows camera={{ position: [0, 1.52, 1.55], fov: 32 }}>
        <color attach="background" args={["#fffaf6"]} />
        <hemisphereLight intensity={0.85} color="#ffffff" groundColor="#cbd5e1" />
        <ambientLight intensity={0.6} />
        <directionalLight castShadow intensity={0.9} position={[2.8, 3.8, 2.4]} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight intensity={0.5} position={[-2.2, 2.4, -1.5]} />
        <spotLight position={[0, 3.8, 2.2]} angle={0.42} penumbra={0.6} intensity={0.4} />

        <OfficeStage />

        <SceneErrorBoundary key={activeModelUrl} fallback={<FallbackAvatar state={state} emotion={emotion} />}>
          <React.Suspense fallback={<FallbackAvatar state={state} emotion={emotion} />}>
            <AvatarModel
              modelUrl={activeModelUrl}
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
        <ContactShadows position={[0, 0.005, 0]} opacity={0.4} blur={2.8} scale={9} far={6} />
        <OrbitControls target={[0, 1.38, 0]} enablePan={false} enableRotate={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
