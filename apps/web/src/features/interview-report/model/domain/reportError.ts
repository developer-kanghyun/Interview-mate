import { getAuthRequiredMessage } from "@/shared/auth/session";

export type ReportFetchErrorCode = "auth_required" | "unknown";

export function classifyReportFetchError(message: string): ReportFetchErrorCode {
  if (message === getAuthRequiredMessage()) {
    return "auth_required";
  }
  return "unknown";
}
