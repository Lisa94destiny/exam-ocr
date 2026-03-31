import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { apiKey, secretKey } = await request.json();

  if (!apiKey || !secretKey) {
    return NextResponse.json(
      { error: "请提供 API Key 和 Secret Key" },
      { status: 400 }
    );
  }

  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;

  const res = await fetch(url, { method: "POST" });
  const data = await res.json();

  if (data.error) {
    return NextResponse.json(
      { error: `获取 Token 失败: ${data.error_description || data.error}` },
      { status: 400 }
    );
  }

  return NextResponse.json({ access_token: data.access_token });
}
