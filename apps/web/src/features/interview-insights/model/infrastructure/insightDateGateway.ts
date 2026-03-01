export function formatInsightStartedAtGateway(startedAt: string): string {
  return new Date(startedAt).toLocaleString();
}
