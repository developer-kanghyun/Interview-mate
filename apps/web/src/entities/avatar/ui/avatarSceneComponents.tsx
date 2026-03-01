"use client";

import * as React from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";

type AvatarEmotion = "neutral" | "encourage" | "pressure";
type AvatarStageVariant = "clean_office" | "minimal";

type FallbackAvatarProps = {
  state: AvatarState;
  emotion: AvatarEmotion;
};

export function FallbackAvatar({ state, emotion }: FallbackAvatarProps) {
  const groupRef = React.useRef<THREE.Group | null>(null);
  const bustRef = React.useRef<THREE.Group | null>(null);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();
    const group = groupRef.current;
    const bust = bustRef.current;

    if (group) {
      const bob =
        state === "asking"
          ? Math.sin(elapsed * 4.8) * 0.012
          : state === "listening"
            ? Math.sin(elapsed * 2.9) * 0.008
            : 0;
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

export function AvatarStage({ variant }: { variant: AvatarStageVariant }) {
  if (variant === "minimal") {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#eef2f6" roughness={0.95} metalness={0.02} />
        </mesh>
        <mesh position={[0, 2.2, -2.7]} receiveShadow>
          <boxGeometry args={[10, 4.6, 0.08]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.92} metalness={0.01} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#edf1f6" roughness={0.94} metalness={0.02} />
      </mesh>

      <mesh position={[0, 2.35, -2.95]} receiveShadow>
        <boxGeometry args={[10.4, 5.0, 0.12]} />
        <meshStandardMaterial color="#f8fbff" roughness={0.9} metalness={0.02} />
      </mesh>

      <mesh position={[0, 1.5, -2.88]}>
        <planeGeometry args={[5.0, 1.8]} />
        <meshStandardMaterial color="#e8eef6" roughness={0.65} metalness={0.02} />
      </mesh>

      <mesh position={[0, 0.74, -0.38]} castShadow receiveShadow>
        <boxGeometry args={[3.15, 0.08, 1.34]} />
        <meshStandardMaterial color="#d9e2ee" roughness={0.58} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.775, 0.27]} receiveShadow>
        <boxGeometry args={[3.16, 0.014, 0.06]} />
        <meshStandardMaterial color="#cbd5e2" roughness={0.4} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.41, -0.93]} castShadow receiveShadow>
        <boxGeometry args={[3.1, 0.63, 0.09]} />
        <meshStandardMaterial color="#cfd8e5" roughness={0.76} metalness={0.04} />
      </mesh>
    </group>
  );
}

export function DebugSceneHelpers() {
  return (
    <group>
      <axesHelper args={[0.8]} />
      <gridHelper args={[4.5, 24, "#cbd5e1", "#e2e8f0"]} position={[0, 0.001, 0]} />
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export function WebglUnavailableAvatar({ state, emotion }: { state: AvatarState; emotion: AvatarEmotion }) {
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
    <div className="relative flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <div className={`flex h-44 w-44 items-center justify-center rounded-full bg-white text-5xl shadow-soft ring-4 ${ringColor}`}>
        🙂
      </div>
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-im-border bg-white/90 px-3 py-1 text-xs font-semibold text-im-text-main">
        {badgeText}
      </span>
    </div>
  );
}
