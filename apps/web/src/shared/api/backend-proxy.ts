import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/shared/auth/auth-cookie";

const FORWARDABLE_HEADERS = ["content-type", "accept", "authorization", "x-guest-api-key"];

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 필요합니다.");
  }
  return baseUrl.replace(/\/$/, "");
}

function resolveUpstreamPath(request: NextRequest) {
  return request.nextUrl.pathname.replace(/^\/api\/backend\/?/, "");
}

function buildUpstreamUrl(request: NextRequest) {
  const upstreamPath = resolveUpstreamPath(request);
  if (!upstreamPath) {
    throw new Error("유효한 백엔드 경로가 필요합니다.");
  }
  return `${getApiBaseUrl()}/${upstreamPath}${request.nextUrl.search}`;
}

function isBodyAllowed(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function isJsonContentType(contentType: string | null) {
  return Boolean(contentType && contentType.includes("application/json"));
}

async function readRequestBody(request: NextRequest) {
  if (!isBodyAllowed(request.method)) {
    return undefined;
  }

  const contentType = request.headers.get("content-type");
  if (
    isJsonContentType(contentType) ||
    (contentType && (contentType.includes("text/") || contentType.includes("application/x-www-form-urlencoded")))
  ) {
    return await request.text();
  }

  return await request.arrayBuffer();
}

function buildUpstreamHeaders(request: NextRequest, upstreamPath: string) {
  const headers = new Headers();
  for (const key of FORWARDABLE_HEADERS) {
    const value = request.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  const apiKeyFromCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (apiKeyFromCookie) {
    headers.set("x-api-key", apiKeyFromCookie);
  }

  if (upstreamPath === "api/auth/google/callback" && apiKeyFromCookie && !headers.has("x-guest-api-key")) {
    headers.set("x-guest-api-key", apiKeyFromCookie);
  }

  return headers;
}

function sanitizeAuthPayload(data: unknown) {
  if (!data || typeof data !== "object") {
    return { data, apiKey: null as string | null };
  }

  const root = data as { data?: Record<string, unknown> };
  const nestedData = root.data;
  if (!nestedData || typeof nestedData !== "object") {
    return { data, apiKey: null as string | null };
  }

  const apiKey = typeof nestedData.api_key === "string" ? nestedData.api_key : null;
  if (!apiKey) {
    return { data, apiKey: null };
  }

  const sanitized = {
    ...root,
    data: {
      ...nestedData
    }
  };
  delete sanitized.data.api_key;

  return { data: sanitized, apiKey };
}

function isAuthCookieIssuingPath(path: string) {
  return path === "api/auth/guest" || path === "api/auth/google/callback";
}

function isAuthFailure(status: number) {
  return status === 401 || status === 403;
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0
  });
}

export async function proxyBackendRequest(request: NextRequest) {
  const upstreamPath = resolveUpstreamPath(request);
  const upstreamResponse = await fetch(buildUpstreamUrl(request), {
    method: request.method,
    headers: buildUpstreamHeaders(request, upstreamPath),
    body: await readRequestBody(request),
    signal: request.signal,
    cache: "no-store"
  });

  const contentType = upstreamResponse.headers.get("content-type");
  const upstreamText = await upstreamResponse.text();
  const responseHeaders = new Headers();
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  if (isJsonContentType(contentType)) {
    let parsed: unknown;
    try {
      parsed = upstreamText ? JSON.parse(upstreamText) : {};
    } catch {
      parsed = upstreamText ? { message: upstreamText } : {};
    }

    const { data: sanitizedData, apiKey } = isAuthCookieIssuingPath(upstreamPath)
      ? sanitizeAuthPayload(parsed)
      : { data: parsed, apiKey: null as string | null };

    const response = NextResponse.json(sanitizedData, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });

    if (apiKey) {
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: apiKey,
        ...AUTH_COOKIE_OPTIONS
      });
    }

    if (isAuthFailure(upstreamResponse.status)) {
      clearAuthCookie(response);
    }

    return response;
  }

  const response = new NextResponse(upstreamText, {
    status: upstreamResponse.status,
    headers: responseHeaders
  });

  if (isAuthFailure(upstreamResponse.status)) {
    clearAuthCookie(response);
  }

  return response;
}

export function toProxyErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "백엔드 프록시 요청에 실패했습니다.";
  return NextResponse.json({ error: { message } }, { status: 500 });
}
