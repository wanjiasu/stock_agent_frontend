import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const backend = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const url = backend ? `${backend}/analyze-and-email` : null;

  if (!url) {
    return NextResponse.json(
      { detail: "未配置后端地址 NEXT_PUBLIC_API_URL" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const contentType = res.headers.get("content-type") ?? "application/json";
  const text = await res.text();

  return new Response(text, {
    status: res.status,
    headers: { "content-type": contentType },
  });
}