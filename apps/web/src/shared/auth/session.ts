"use client";

const LEGACY_API_KEY_STORAGE_KEY = "interviewMateApiKey";
const SESSION_ID_STORAGE_KEY = "interviewMateSessionId";
const AUTH_REQUIRED_MESSAGE = "로그인이 필요합니다. 다시 로그인해 주세요.";

export function clearLegacyApiKeyStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
}

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
  return value && value.trim() ? value : null;
}

export function setStoredSessionId(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
}

export function clearStoredSessionId() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(SESSION_ID_STORAGE_KEY);
}

export function getAuthRequiredMessage() {
  return AUTH_REQUIRED_MESSAGE;
}
