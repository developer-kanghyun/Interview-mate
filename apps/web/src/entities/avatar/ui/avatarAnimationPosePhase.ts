import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { AvatarState } from "@/entities/avatar/model/avatarBehaviorMachine";
import { AVATAR_RELAX_POSE_CALIBRATION } from "@/entities/avatar/model/avatarPoseCalibration";
import {
  accumulateBoneEuler,
  blendBoneEuler,
  smoothFactor,
  type BoneEulerOffset,
  type BoneEulerOffsets,
  type BoneKey,
  type BonePose,
  type BoneRig
} from "@/entities/avatar/ui/avatarAnimation.helpers";

type AvatarAnimationCharacter = "zet" | "luna" | "iron";

type ApplyAvatarPosePhaseOptions = {
  elapsed: number;
  delta: number;
  character: AvatarAnimationCharacter;
  state: AvatarState;
  cuePulse: number;
  rootGroupRef: MutableRefObject<THREE.Group | null>;
  boneRigRef: MutableRefObject<BoneRig>;
  boneBasePoseRef: MutableRefObject<Partial<Record<BoneKey, BonePose>>>;
};

export function applyAvatarPosePhase({
  elapsed,
  delta,
  character,
  state,
  cuePulse,
  rootGroupRef,
  boneRigRef,
  boneBasePoseRef
}: ApplyAvatarPosePhaseOptions) {
  const rig = boneRigRef.current;
  const basePose = boneBasePoseRef.current;
  const group = rootGroupRef.current;
  const boneLerp = smoothFactor(10, delta);
  const relaxCalibration = AVATAR_RELAX_POSE_CALIBRATION[character].relax;
  const poseOffsets: BoneEulerOffsets = {};

  const breath = Math.sin(elapsed * 1.8) * 0.03;
  const subtleTurn = Math.sin(elapsed * 0.9) * 0.03;

  accumulateBoneEuler(poseOffsets, "spine", breath * 0.08, subtleTurn * 0.08, 0);
  accumulateBoneEuler(poseOffsets, "spine1", breath * 0.12, subtleTurn * 0.12, 0);
  accumulateBoneEuler(poseOffsets, "spine2", breath * 0.16, subtleTurn * 0.16, 0);
  accumulateBoneEuler(poseOffsets, "neck", 0, subtleTurn * 0.45, 0);
  accumulateBoneEuler(poseOffsets, "head", 0.02, subtleTurn * 0.56, 0);

  (Object.entries(relaxCalibration) as Array<
    [keyof typeof relaxCalibration, (typeof relaxCalibration)[keyof typeof relaxCalibration]]
  >).forEach(([key, offset]) => {
    if (!offset) {
      return;
    }
    accumulateBoneEuler(poseOffsets, key as BoneKey, offset.x, offset.y, offset.z);
  });

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

  if (!group) {
    return;
  }

  const baseY = 0.1;
  const targetY =
    baseY + Math.sin(elapsed * 1.8) * 0.0024 + (state === "celebrate" ? Math.abs(Math.sin(elapsed * 7.8)) * 0.006 : 0);
  const targetZ = -0.12;
  const targetX = 0.007;
  group.position.y = THREE.MathUtils.lerp(group.position.y, targetY, delta * 2.2);
  group.position.z = THREE.MathUtils.lerp(group.position.z, targetZ, delta * 2.2);
  group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetX, delta * 2.2);
  group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, 0, delta * 2.2);
  group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, delta * 2.2);
}
