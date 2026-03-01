export function resolveStartSessionErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "면접 시작에 실패했습니다.";
}
