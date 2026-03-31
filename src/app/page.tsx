"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import ApiConfig from "@/components/ApiConfig";
import AiConfig from "@/components/AiConfig";
import ImageUploader from "@/components/ImageUploader";
import ImagePreview from "@/components/ImagePreview";
import OcrResultCard from "@/components/OcrResultCard";
import {
  loadApiConfig,
  saveApiConfig,
  clearApiConfig,
  loadAiConfig,
  saveAiConfig,
  clearAiConfig,
} from "@/lib/storage";
import { getAccessToken, recognizeImage } from "@/lib/baidu-ocr";
import { mergeOcrResults } from "@/lib/merge-results";
import type { ImageItem, OcrResponse } from "@/types/ocr";
import type { AiConfig as AiConfigType } from "@/types/ai";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [configOpen, setConfigOpen] = useState(false);
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [aiConfig, setAiConfig] = useState<AiConfigType | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recgFormula, setRecgFormula] = useState(false);
  const [aiPolishing, setAiPolishing] = useState(false);
  const [polishedTexts, setPolishedTexts] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const saved = loadApiConfig();
    if (saved) {
      setApiKey(saved.apiKey);
      setSecretKey(saved.secretKey);
      setAccessToken(saved.accessToken);
    }
    const savedAi = loadAiConfig();
    if (savedAi) setAiConfig(savedAi);
  }, []);

  const handleSaveConfig = async (key: string, secret: string) => {
    const token = await getAccessToken(key, secret);
    setApiKey(key);
    setSecretKey(secret);
    setAccessToken(token);
    saveApiConfig({ apiKey: key, secretKey: secret, accessToken: token });
  };

  const handleClearConfig = () => {
    setApiKey("");
    setSecretKey("");
    setAccessToken("");
    clearApiConfig();
    setConfigOpen(false);
  };

  const handleSaveAiConfig = (config: AiConfigType) => {
    setAiConfig(config);
    saveAiConfig(config);
  };

  const handleClearAiConfig = () => {
    setAiConfig(null);
    clearAiConfig();
    setAiConfigOpen(false);
  };

  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newImages: ImageItem[] = await Promise.all(
      files.map(async (file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        base64: await fileToBase64(file),
        status: "pending" as const,
      }))
    );
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
    setPolishedTexts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleStartOcr = async () => {
    if (!accessToken) {
      setConfigOpen(true);
      return;
    }

    const pendingImages = images.filter(
      (img) => img.status === "pending" || img.status === "error"
    );
    if (pendingImages.length === 0) return;

    setProcessing(true);

    for (const img of pendingImages) {
      setImages((prev) =>
        prev.map((i) =>
          i.id === img.id ? { ...i, status: "processing" } : i
        )
      );

      try {
        const result = (await recognizeImage(img.base64, accessToken, {
          recgFormula,
        })) as OcrResponse;

        if (result.error_code) {
          throw new Error(result.error_msg || `错误码: ${result.error_code}`);
        }

        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, status: "done", ocrResult: result } : i
          )
        );
      } catch (e) {
        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? {
                  ...i,
                  status: "error",
                  errorMsg: e instanceof Error ? e.message : "识别失败",
                }
              : i
          )
        );
      }
    }

    setProcessing(false);
  };

  const handleAiPolish = async () => {
    if (!aiConfig) {
      setAiConfigOpen(true);
      return;
    }

    const doneImages = images.filter(
      (img) => img.status === "done" && img.ocrResult && !polishedTexts[img.id]
    );
    if (doneImages.length === 0) return;

    setAiPolishing(true);

    for (const img of doneImages) {
      try {
        const lines = mergeOcrResults(
          img.ocrResult!.results || [],
          img.ocrResult!.words_result
        );
        const rawText = lines.map((l) => l.text).join("\n");

        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: rawText,
            provider: aiConfig.provider,
            apiKey: aiConfig.apiKey,
            secretKey: aiConfig.secretKey,
            accessToken: aiConfig.accessToken,
            baseUrl: aiConfig.baseUrl,
            model: aiConfig.model,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setPolishedTexts((prev) => ({ ...prev, [img.id]: data.result }));
      } catch (e) {
        alert(
          `${img.file.name} AI 整理失败: ${e instanceof Error ? e.message : "未知错误"}`
        );
      }
    }

    setAiPolishing(false);
  };

  const handleExport = async () => {
    const doneImages = images.filter(
      (img) => img.status === "done" && img.ocrResult
    );
    if (doneImages.length === 0) return;

    setExporting(true);
    try {
      const pages = doneImages.map((img) => ({
        fileName: img.file.name.replace(/\.[^.]+$/, ""),
        results: img.ocrResult!.results || [],
        words_result: img.ocrResult!.words_result,
        formula_result: img.ocrResult!.formula_result,
        polishedText: polishedTexts[img.id] || null,
      }));

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });

      if (!res.ok) throw new Error("导出失败");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "试卷识别结果.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };

  const doneCount = images.filter((i) => i.status === "done").length;
  const pendingCount = images.filter(
    (i) => i.status === "pending" || i.status === "error"
  ).length;
  const polishedCount = Object.keys(polishedTexts).length;
  const unpolishedCount = doneCount - polishedCount;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onOpenConfig={() => setConfigOpen(true)}
        onOpenAiConfig={() => setAiConfigOpen(true)}
        hasToken={!!accessToken}
        hasAiConfig={!!aiConfig}
      />

      <ApiConfig
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        apiKey={apiKey}
        secretKey={secretKey}
        accessToken={accessToken}
        onSave={handleSaveConfig}
        onClear={handleClearConfig}
      />

      <AiConfig
        open={aiConfigOpen}
        onClose={() => setAiConfigOpen(false)}
        config={aiConfig}
        onSave={handleSaveAiConfig}
        onClear={handleClearAiConfig}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {/* Hero */}
        {images.length === 0 && (
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              试卷照片转 Word
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base max-w-md mx-auto">
              上传试卷照片，智能识别文字与公式，AI 整理后导出 Word 文档
            </p>
          </div>
        )}

        {/* No token hint */}
        {!accessToken && images.length === 0 && (
          <div className="mb-8 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              首次使用请先{" "}
              <button
                onClick={() => setConfigOpen(true)}
                className="text-black underline underline-offset-2 font-medium"
              >
                配置百度 OCR API
              </button>
              {" "}和{" "}
              <button
                onClick={() => setAiConfigOpen(true)}
                className="text-black underline underline-offset-2 font-medium"
              >
                AI 整理接口（可选）
              </button>
            </p>
          </div>
        )}

        {/* Options */}
        <div className="mb-5 flex items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={recgFormula}
              onClick={() => setRecgFormula(!recgFormula)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                recgFormula ? "bg-black" : "bg-[#d4d4d4]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  recgFormula ? "translate-x-4" : ""
                }`}
              />
            </button>
            <span className="text-sm">识别公式</span>
          </label>
        </div>

        {/* Upload area */}
        <div className="mb-8">
          <ImageUploader
            onFilesAdded={handleFilesAdded}
            disabled={processing}
          />
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
                已上传 {images.length} 张图片
                {doneCount > 0 && (
                  <span className="text-green-600 ml-2">
                    · {doneCount} 张已识别
                  </span>
                )}
                {polishedCount > 0 && (
                  <span className="text-blue-600 ml-2">
                    · {polishedCount} 张已整理
                  </span>
                )}
              </h3>
              <div className="flex gap-3 flex-wrap">
                {doneCount > 0 && (
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-5 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                  >
                    {exporting ? "导出中..." : `导出 Word (${doneCount})`}
                  </button>
                )}
                {doneCount > 0 && unpolishedCount > 0 && (
                  <button
                    onClick={handleAiPolish}
                    disabled={aiPolishing}
                    className="px-5 py-2 text-sm border border-black text-black rounded-lg hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
                  >
                    {aiPolishing
                      ? "AI 整理中..."
                      : `AI 整理 (${unpolishedCount})`}
                  </button>
                )}
                {pendingCount > 0 && (
                  <button
                    onClick={handleStartOcr}
                    disabled={processing}
                    className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-black/85 transition-colors disabled:opacity-50"
                  >
                    {processing
                      ? "识别中..."
                      : `开始识别 (${pendingCount})`}
                  </button>
                )}
              </div>
            </div>

            <ImagePreview images={images} onRemove={handleRemoveImage} />
          </div>
        )}

        {/* OCR Results */}
        {doneCount > 0 && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">
              识别结果
            </h3>
            {images
              .filter((img) => img.status === "done" && img.ocrResult)
              .map((img) => (
                <OcrResultCard
                  key={img.id}
                  image={img}
                  polishedText={polishedTexts[img.id]}
                />
              ))}
          </div>
        )}

        {/* Error list */}
        {images.some((i) => i.status === "error") && (
          <div className="mt-6 space-y-2">
            {images
              .filter((i) => i.status === "error")
              .map((img) => (
                <div
                  key={img.id}
                  className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
                >
                  {img.file.name}: {img.errorMsg || "识别失败"}
                </div>
              ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-6">
        <p className="text-center text-xs text-[var(--color-text-secondary)]">
          试卷 OCR · 基于百度文字识别 API · 数据仅在本地处理
        </p>
      </footer>
    </div>
  );
}
