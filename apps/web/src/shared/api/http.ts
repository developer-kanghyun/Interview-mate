import { getAuthRequiredMessage } from "@/shared/auth/session";

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

function buildHeaders(hasJsonBody: boolean, headers?: HeadersInit): Headers {
  const mergedHeaders = new Headers(headers);

  if (hasJsonBody && !mergedHeaders.has("Content-Type")) {
    mergedHeaders.set("Content-Type", "application/json");
  }

  return mergedHeaders;
}

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && (error.name === "AbortError" || error.message === "timeout"))
  );
}

function isAuthenticationFailure(status: number) {
  return status === 401 || status === 403;
}

function isTooManyRequests(status: number) {
  return status === 429;
}

function buildProxyPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/api/backend${normalized}`;
}

function createRequestSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

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
    didTimeout: () => timedOut,
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
  const { signal: requestSignal, didTimeout, cleanup } = createRequestSignal(signal, timeoutMs);

  try {
    const response = await fetch(buildProxyPath(path), {
      method,
      headers: buildHeaders(hasJsonBody, headers),
      body: hasJsonBody ? JSON.stringify(body) : (body as BodyInit | undefined),
      signal: requestSignal,
      credentials: "include"
    });

    if (!response.ok) {
      const payload = await parsePayload(response).catch(() => null);
      if (requireAuth && isAuthenticationFailure(response.status)) {
        throw new Error(getAuthRequiredMessage());
      }
      if (isTooManyRequests(response.status)) {
        const retryAfterSeconds = response.headers.get("retry-after");
        const message = retryAfterSeconds
          ? `요청이 많습니다. ${retryAfterSeconds}초 후 다시 시도해 주세요.`
          : "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
        throw new HttpError(message, response.status, payload);
      }
      if (response.status >= 500) {
        throw new HttpError("서버 응답에 실패했습니다. 잠시 후 다시 시도해 주세요.", response.status, payload);
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
      if (didTimeout()) {
        throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
      }
      throw new Error("요청이 취소되었습니다.");
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
