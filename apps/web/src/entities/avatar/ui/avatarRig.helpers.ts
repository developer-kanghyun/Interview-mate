import * as THREE from "three";
import {
  boneNameCandidates,
  requiredRigBones
} from "@/entities/avatar/ui/avatarRig.config";
import type { BoneKey } from "@/entities/avatar/ui/avatarRig.config";

export { requiredRigBones };
export type { BoneKey };

export type ModelFrame = {
  fullHeight: number;
  headY: number;
  chestY: number;
};

export type BoneRig = Partial<Record<BoneKey, THREE.Bone>>;

export type BonePose = {
  quaternion: THREE.Quaternion;
  position: THREE.Vector3;
};

export type BoneEulerOffset = {
  x: number;
  y: number;
  z: number;
};

export type BoneEulerOffsets = Partial<Record<BoneKey, BoneEulerOffset>>;

export function normalizeModel(modelRoot: THREE.Object3D, targetHeight = 1.72): ModelFrame | null {
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

export function collectBones(scene: THREE.Object3D) {
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

export function blendBoneEuler(
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

export function accumulateBoneEuler(
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

export function fitCameraToUpperBody(camera: THREE.Camera, frame: ModelFrame) {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  camera.fov = 23;

  const baseLookY = 1.58;
  const baseCameraY = 1.72;
  const baseCameraZ = 1.36;
  const targetHeadY = 1.67;
  const headDelta = THREE.MathUtils.clamp(frame.headY - targetHeadY, -0.18, 0.18);

  camera.position.set(0, baseCameraY + headDelta * 0.12, baseCameraZ + headDelta * 0.12);
  camera.lookAt(0, baseLookY + headDelta * 0.05, 0);
  camera.updateProjectionMatrix();
}
