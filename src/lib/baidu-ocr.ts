export async function getAccessToken(
  apiKey: string,
  secretKey: string
): Promise<string> {
  const res = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, secretKey }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.access_token;
}

export interface OcrOptions {
  recgFormula?: boolean;
}

export async function recognizeImage(
  base64Image: string,
  accessToken: string,
  options?: OcrOptions
): Promise<unknown> {
  const res = await fetch("/api/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: base64Image,
      accessToken,
      recgFormula: options?.recgFormula ?? false,
    }),
  });
  const data = await res.json();
  if (data.error_code) {
    throw new Error(data.error_msg || `OCR Error: ${data.error_code}`);
  }
  return data;
}
