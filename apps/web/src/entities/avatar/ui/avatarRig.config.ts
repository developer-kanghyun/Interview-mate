export type BoneKey =
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

export const requiredRigBones: BoneKey[] = [
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

export const boneNameCandidates: Record<BoneKey, string[]> = {
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
