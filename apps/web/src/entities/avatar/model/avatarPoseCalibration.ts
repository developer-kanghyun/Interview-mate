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
      leftShoulder: { x: 1.119, y: 0.221, z: 0.073 },
      rightShoulder: { x: 1.119, y: -0.221, z: -0.073 },
      leftArm: { x: -0.754, y: 0.008, z: -0.176 },
      rightArm: { x: -0.754, y: -0.008, z: 0.176 },
      leftForeArm: { x: 0.091, y: 0.008, z: -0.495 },
      rightForeArm: { x: 0.091, y: -0.008, z: 0.495 }
    }
  },
  zet: {
    relax: {
      leftShoulder: { x: 1.119, y: 0.221, z: 0.073 },
      rightShoulder: { x: 1.119, y: -0.221, z: -0.073 },
      leftArm: { x: -0.754, y: 0.008, z: -0.176 },
      rightArm: { x: -0.754, y: -0.008, z: 0.176 },
      leftForeArm: { x: 0.091, y: 0.008, z: -0.495 },
      rightForeArm: { x: 0.091, y: -0.008, z: 0.495 }
    }
  },
  iron: {
    relax: {
      leftShoulder: { x: 1.119, y: 0.221, z: 0.073 },
      rightShoulder: { x: 1.119, y: -0.221, z: -0.073 },
      leftArm: { x: -0.754, y: 0.008, z: -0.176 },
      rightArm: { x: -0.754, y: -0.008, z: 0.176 },
      leftForeArm: { x: 0.091, y: 0.008, z: -0.495 },
      rightForeArm: { x: 0.091, y: -0.008, z: 0.495 }
    }
  }
};
