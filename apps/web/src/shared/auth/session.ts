"use client";

const API_KEY_STORAGE_KEY = "interviewMateApiKey";
const SESSION_ID_STORAGE_KEY = "interviewMateSessionId";

function readNonEmptyValue(value: string | null): string | null {
  return value && value.trim() ? value : null;
}

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const sessionValue = readNonEmptyValue(window.sessionStorage.getItem(API_KEY_STORAGE_KEY));
  if (sessionValue) {
    return sessionValue;
  }

  // Migrate legacy storage to sessionStorage for safer runtime-only persistence.
  const legacyLocalValue = readNonEmptyValue(window.localStorage.getItem(API_KEY_STORAGE_KEY));
  if (!legacyLocalValue) {
    return null;
  }

  window.sessionStorage.setItem(API_KEY_STORAGE_KEY, legacyLocalValue);
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
  return legacyLocalValue;
}

export function setStoredApiKey(apiKey: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  window.localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export function clearStoredApiKey() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
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
