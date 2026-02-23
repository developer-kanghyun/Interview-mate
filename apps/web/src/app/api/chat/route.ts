import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/shared/auth/auth-cookie";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive"
} as const;

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 환경변수가 필요합니다.");
  }
  return baseUrl;
}

function pickForwardHeader(request: NextRequest, key: string) {
  const value = request.headers.get(key);
  return value ? { [key]: value } : {};
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: { message: "유효한 JSON 요청이 필요합니다." } }, { status: 400 });
  }

  try {
    const apiKeyFromCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    const upstreamResponse = await fetch(`${getApiBaseUrl()}/api/chat/completions/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKeyFromCookie ? { "x-api-key": apiKeyFromCookie } : {}),
        ...pickForwardHeader(request, "authorization")
      },
      body: JSON.stringify(payload),
      signal: request.signal
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const fallback = `질문 스트리밍 요청이 실패했습니다. (${upstreamResponse.status})`;
      const errorText = await upstreamResponse.text().catch(() => "");
      const message = errorText || fallback;
      const response = NextResponse.json({ error: { message } }, { status: upstreamResponse.status || 502 });
      if (upstreamResponse.status === 401 || upstreamResponse.status === 403) {
        response.cookies.set({
          name: AUTH_COOKIE_NAME,
          value: "",
          ...AUTH_COOKIE_OPTIONS,
          maxAge: 0
        });
      }
      return response;
    }

    return new Response(upstreamResponse.body, {
      status: 200,
      headers: SSE_HEADERS
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "스트리밍 프록시 연결에 실패했습니다.";
    return Response.json({ error: { message } }, { status: 500 });
  }
}
