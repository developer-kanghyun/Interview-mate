import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/shared/auth/auth-cookie";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(new RegExp('/$'), "");
  if (!baseUrl) {
    return NextResponse.json({ error: { message: "API 설정 오류" } }, { status: 500 });
  }

  const upstreamUrl = `${baseUrl}/api/tts/synthesize`;
  
  const headers = new Headers();
  headers.set("content-type", "application/json");
  
  const apiKey = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  try {
    const body = await request.text();
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body,
      signal: request.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: { message: "인증 오류" } }, { status: response.status });
      }
      return new NextResponse(await response.text(), { status: response.status });
    }

    // Stream the binary response directly back to the client
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "audio/mpeg",
      },
    });

  } catch (error) {
    if (request.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json({ error: { message: "TTS 서버 요청 실패" } }, { status: 500 });
  }
}
