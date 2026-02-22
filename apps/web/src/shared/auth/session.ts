"use client";

const API_KEY_STORAGE_KEY = "interviewMateApiKey";
const SESSION_ID_STORAGE_KEY = "interviewMateSessionId";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(API_KEY_STORAGE_KEY);
  return value && value.trim() ? value : null;
}

export function setStoredApiKey(apiKey: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
}

export function clearStoredApiKey() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
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
