import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `你是一个试卷文字整理助手。用户会给你 OCR 识别出的试卷文字内容，请你：

1. 修正明显的 OCR 识别错误和错别字
2. 理顺排版，使题目结构清晰（题号、选项对齐）
3. 补全被截断或拆散的句子
4. 保留原始内容含义，不要添加或删除题目内容
5. 如果有数学公式，用标准写法表示（如 R₁、P=UI 等，不要用 LaTeX）

直接返回整理后的文字，不要添加任何解释或说明。`;

interface RequestBody {
  text: string;
  provider: string;
  apiKey: string;
  secretKey?: string;
  accessToken?: string;
  baseUrl: string;
  model: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { text, provider, apiKey, baseUrl, model } = body;

    if (!text || !apiKey || !baseUrl || !model) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    let result: string;

    if (provider === "baidu") {
      result = await callBaidu(body);
    } else {
      // aliyun, doubao, custom — all OpenAI-compatible
      result = await callOpenAICompatible(text, apiKey, baseUrl, model);
    }

    return NextResponse.json({ result });
  } catch (e) {
    console.error("AI error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI 整理失败" },
      { status: 500 }
    );
  }
}

async function callOpenAICompatible(
  text: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI 请求失败 (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callBaidu(body: RequestBody): Promise<string> {
  let { accessToken } = body;

  // Get token if not provided
  if (!accessToken && body.apiKey && body.secretKey) {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(body.apiKey)}&client_secret=${encodeURIComponent(body.secretKey)}`;
    const tokenRes = await fetch(tokenUrl, { method: "POST" });
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(`百度 Token 获取失败: ${tokenData.error_description}`);
    }
    accessToken = tokenData.access_token;
  }

  if (!accessToken) {
    throw new Error("缺少百度 access_token");
  }

  const url = `${body.baseUrl.replace(/\/$/, "")}/${body.model}?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "user", content: `${SYSTEM_PROMPT}\n\n以下是需要整理的内容：\n\n${body.text}` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`百度 AI 请求失败 (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (data.error_code) {
    throw new Error(data.error_msg || `错误码: ${data.error_code}`);
  }
  return data.result || "";
}
