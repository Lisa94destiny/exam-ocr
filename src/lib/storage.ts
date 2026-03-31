import { ApiConfig } from "@/types/ocr";
import { AiConfig } from "@/types/ai";

const OCR_KEY = "exam-ocr-api-config";
const AI_KEY = "exam-ocr-ai-config";

export function saveApiConfig(config: ApiConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OCR_KEY, JSON.stringify(config));
}

export function loadApiConfig(): ApiConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(OCR_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiConfig;
  } catch {
    return null;
  }
}

export function clearApiConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OCR_KEY);
}

export function saveAiConfig(config: AiConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AI_KEY, JSON.stringify(config));
}

export function loadAiConfig(): AiConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AI_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AiConfig;
  } catch {
    return null;
  }
}

export function clearAiConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AI_KEY);
}
