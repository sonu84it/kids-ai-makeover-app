import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function proxy(request: NextRequest, params: { path: string[] }) {
  if (!API_BASE_URL) {
    return NextResponse.json({ error: "api_base_url_missing" }, { status: 500 });
  }

  const upstreamPath = params.path.join("/");
  const search = request.nextUrl.search || "";
  const upstreamUrl = `${API_BASE_URL}/${upstreamPath}${search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  };

  if (init.body) {
    init.duplex = "half";
  }

  const response = await fetch(upstreamUrl, init);

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers
  });
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params);
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params);
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params);
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params);
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params);
}

export async function OPTIONS(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params);
}
