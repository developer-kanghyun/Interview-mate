import { apiBaseUrl } from "@/shared/config/env";
import { clearStoredApiKey, getAuthRequiredMessage, getRequiredApiKey } from "@/shared/auth/session";

const DEFAULT_TIMEOUT_MS = 10_000;

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
  requireAuth?: boolean;
  signal?: AbortSignal;
  fallbackMessage?: string;
};

export class HttpError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

function resolveMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload !== "object" || payload === null) {
    return fallbackMessage;
  }

  const withError = payload as { error?: { message?: string }; message?: string };
  return withError.error?.message || withError.message || fallbackMessage;
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function buildHeaders(requireAuth: boolean, hasJsonBody: boolean, headers?: HeadersInit): Headers {
  const mergedHeaders = new Headers(headers);

  if (requireAuth && !mergedHeaders.has("X-API-Key")) {
    mergedHeaders.set("X-API-Key", getRequiredApiKey());
  }

  if (hasJsonBody && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  return mergedHeaders;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function isAuthenticationFailure(status: number) {
  return status === 401 || status === 403;
}

function createRequestSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);

  const onAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  };
}

async function request(path: string, options: RequestOptions = {}) {
  const {
    method = "GET",
    body,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    requireAuth = true,
    signal,
    fallbackMessage = "요청 처리 중 오류가 발생했습니다."
  } = options;

  const hasJsonBody = body !== undefined && body !== null && !(body instanceof FormData);
  const { signal: requestSignal, cleanup } = createRequestSignal(signal, timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: buildHeaders(requireAuth, hasJsonBody, headers),
      body: hasJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
      signal: requestSignal
    });

    if (!response.ok) {
      const payload = await parsePayload(response).catch(() => null);
      if (requireAuth && isAuthenticationFailure(response.status)) {
        clearStoredApiKey();
        throw new Error(getAuthRequiredMessage());
      }
      throw new HttpError(resolveMessage(payload, fallbackMessage), response.status, payload);
    }

    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    if (error instanceof Error && error.message === getAuthRequiredMessage()) {
      throw error;
    }
    if (isAbortError(error)) {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw new Error(fallbackMessage);
  } finally {
    cleanup();
  }
}

export async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const response = await request(path, options);
  return (await response.json()) as T;
}

export async function requestText(path: string, options: RequestOptions = {}) {
  const response = await request(path, options);
  return response.text();
}
