import { clearStoredSessionId } from "@/shared/auth/session";

export function clearLandingSession() {
  try {
    localStorage.removeItem("im_session_id");
    localStorage.removeItem("im_api_key");
    clearStoredSessionId();
  } catch {
    // ignore storage errors on logout action
  }
}
