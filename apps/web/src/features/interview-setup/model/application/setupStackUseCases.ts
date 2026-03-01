import {
  parseSelectedStacks,
  toggleSelectedStack
} from "@/features/interview-setup/model/domain/setupStackPolicy";
import { serializeSetupStacksGateway } from "@/features/interview-setup/model/infrastructure/setupStackGateway";

export function parseSetupStacksUseCase(value: string, allowedStacks: string[]): string[] {
  return parseSelectedStacks(value, allowedStacks);
}

export function toggleSetupStackUseCase(
  selectedStacks: string[],
  stack: string,
  maxStacks: number
): string[] {
  return toggleSelectedStack(selectedStacks, stack, maxStacks);
}

export function serializeSetupStacksUseCase(stacks: string[]): string {
  return serializeSetupStacksGateway(stacks);
}
