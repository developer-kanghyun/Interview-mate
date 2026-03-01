import { NextRequest } from "next/server";
import { proxyBackendRequest, toProxyErrorResponse } from "@/shared/api/backend-proxy";

async function handleProxyRequest(request: NextRequest) {
  try {
    return await proxyBackendRequest(request);
  } catch (error) {
    return toProxyErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request);
}
