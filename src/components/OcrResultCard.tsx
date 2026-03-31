"use client";

import { useState } from "react";
import { ImageItem } from "@/types/ocr";
import { mergeOcrResults } from "@/lib/merge-results";

interface OcrResultCardProps {
  image: ImageItem;
  polishedText?: string;
}

export default function OcrResultCard({
  image,
  polishedText,
}: OcrResultCardProps) {
  const result = image.ocrResult;
  if (!result) return null;

  const [showPolished, setShowPolished] = useState(true);

  const mergedLines = mergeOcrResults(
    result.results || [],
    result.words_result
  );
  const hasWordsResult = !!result.words_result?.length;

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={image.preview}
            alt=""
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <p className="text-sm font-medium">{image.file.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              识别到 {mergedLines.length} 行文字
              {polishedText && (
                <span className="text-blue-600 ml-1">· 已 AI 整理</span>
              )}
            </p>
          </div>
        </div>

        {/* Toggle between OCR raw / AI polished */}
        {polishedText && (
          <div className="flex bg-[var(--color-border)] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setShowPolished(false)}
              className={`px-3 py-1 rounded-md transition-colors ${
                !showPolished
                  ? "bg-white text-black shadow-sm"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              原始
            </button>
            <button
              onClick={() => setShowPolished(true)}
              className={`px-3 py-1 rounded-md transition-colors ${
                showPolished
                  ? "bg-white text-black shadow-sm"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              AI 整理
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-1.5 max-h-96 overflow-y-auto">
        {polishedText && showPolished ? (
          // AI polished version
          polishedText.split("\n").map((line, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {line}
            </p>
          ))
        ) : (
          // Raw OCR version
          <>
            {mergedLines.map((line, i) => (
              <p key={i} className="text-sm leading-relaxed">
                {line.text}
              </p>
            ))}

            {!hasWordsResult &&
              result.formula_result &&
              result.formula_result.length > 0 && (
                <div className="pt-3 mt-3 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                    公式
                  </p>
                  {result.formula_result.map((f, i) => (
                    <code
                      key={i}
                      className="block text-xs bg-[var(--color-surface)] rounded-lg px-3 py-2 mb-1 font-mono"
                    >
                      {f.form_words}
                    </code>
                  ))}
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
