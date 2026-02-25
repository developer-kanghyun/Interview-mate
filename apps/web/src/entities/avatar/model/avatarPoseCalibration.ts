export type AvatarCharacterKey = "zet" | "luna" | "iron";

export type AvatarRelaxBoneKey =
  | "leftShoulder"
  | "rightShoulder"
  | "leftArm"
  | "rightArm"
  | "leftForeArm"
  | "rightForeArm";

export type BoneEulerOffset = {
  x: number;
  y: number;
  z: number;
};

export type AvatarPoseCalibration = {
  relax: Partial<Record<AvatarRelaxBoneKey, BoneEulerOffset>>;
};

export const AVATAR_RELAX_POSE_CALIBRATION: Record<AvatarCharacterKey, AvatarPoseCalibration> = {
  luna: {
    relax: {
      leftShoulder: { x: -0.34, y: 0.06, z: 0.95 },
      rightShoulder: { x: -0.34, y: -0.06, z: -0.95 },
      leftArm: { x: -1.34, y: 0.1, z: 1.28 },
      rightArm: { x: -1.34, y: -0.1, z: -1.28 },
      leftForeArm: { x: -0.78, y: 0.08, z: 0.42 },
      rightForeArm: { x: -0.78, y: -0.08, z: -0.42 }
    }
  },
  zet: {
    relax: {
      leftShoulder: { x: -0.34, y: 0.06, z: 0.9 },
      rightShoulder: { x: -0.34, y: -0.06, z: -0.9 },
      leftArm: { x: -1.34, y: 0.1, z: 1.22 },
      rightArm: { x: -1.34, y: -0.1, z: -1.22 },
      leftForeArm: { x: -0.78, y: 0.08, z: 0.4 },
      rightForeArm: { x: -0.78, y: -0.08, z: -0.4 }
    }
  },
  iron: {
    relax: {
      leftShoulder: { x: -0.34, y: 0.06, z: 0.86 },
      rightShoulder: { x: -0.34, y: -0.06, z: -0.86 },
      leftArm: { x: -1.34, y: 0.1, z: 1.18 },
      rightArm: { x: -1.34, y: -0.1, z: -1.18 },
      leftForeArm: { x: -0.78, y: 0.08, z: 0.38 },
      rightForeArm: { x: -0.78, y: -0.08, z: -0.38 }
    }
  }
};
