import { MAX_STACKS } from "@/features/interview-setup/ui/setupView.constants";

export function parseSelectedStacks(value: string, allowedStacks: string[]): string[] {
  return value
    .split(",")
    .map((stack) => stack.trim())
    .filter((stack) => stack.length > 0 && allowedStacks.includes(stack));
}

export function toggleSelectedStack(
  selectedStacks: string[],
  stack: string,
  maxStacks = MAX_STACKS
): string[] {
  if (selectedStacks.includes(stack)) {
    return selectedStacks.filter((selected) => selected !== stack);
  }
  return [...selectedStacks, stack].slice(0, maxStacks);
}
