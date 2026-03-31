import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { image, accessToken, recgFormula = false } = await request.json();

  if (!image || !accessToken) {
    return NextResponse.json(
      { error: "缺少图片数据或 access_token" },
      { status: 400 }
    );
  }

  const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/doc_analysis?access_token=${encodeURIComponent(accessToken)}`;

  const params = new URLSearchParams({
    image,
    language_type: "CHN_ENG",
    result_type: "big",
    layout_analysis: "true",
    recg_formula: recgFormula ? "true" : "false",
    detect_direction: "true",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
