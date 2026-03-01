export function resolveOAuthRedirectTarget(search: string): string | null {
  const rawTarget = new URLSearchParams(search).get("redirectTo");
  if (!rawTarget) {
    return null;
  }

  const trimmed = rawTarget.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.startsWith("/auth/google/callback")) {
    return null;
  }

  return trimmed;
}
