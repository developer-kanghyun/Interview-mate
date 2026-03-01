"use client";

import * as React from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import { AVATAR_GLB_BY_CHARACTER } from "@/shared/config/avatarAssets";
import {
  AvatarStage,
  DebugSceneHelpers,
  FallbackAvatar,
  WebglUnavailableAvatar
} from "@/entities/avatar/ui/avatarSceneComponents";
import { canUseWebGL } from "@/entities/avatar/ui/avatarAnimation.helpers";
import { AvatarModel } from "@/entities/avatar/ui/avatarModelNode";

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

const modelUrlByCharacter: Record<AvatarCharacter, string> = AVATAR_GLB_BY_CHARACTER;

useGLTF.preload(AVATAR_GLB_BY_CHARACTER.luna);
useGLTF.preload(AVATAR_GLB_BY_CHARACTER.zet);
useGLTF.preload(AVATAR_GLB_BY_CHARACTER.iron);

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
