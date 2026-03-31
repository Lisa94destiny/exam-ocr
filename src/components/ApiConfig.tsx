"use client";

import { useState } from "react";

interface ApiConfigProps {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  secretKey: string;
  accessToken: string;
  onSave: (apiKey: string, secretKey: string) => Promise<void>;
  onClear: () => void;
}

export default function ApiConfig({
  open,
  onClose,
  apiKey: initialApiKey,
  secretKey: initialSecretKey,
  accessToken,
  onSave,
  onClear,
}: ApiConfigProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [secretKey, setSecretKey] = useState(initialSecretKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!apiKey.trim() || !secretKey.trim()) {
      setError("请填写 API Key 和 Secret Key");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave(apiKey.trim(), secretKey.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "验证失败");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">百度 OCR API 配置</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的 API Key"
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="输入你的 Secret Key"
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
            />
          </div>

          {accessToken && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Token 已获取，API 可用
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {accessToken && (
            <button
              onClick={onClear}
              className="px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            >
              清除配置
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm bg-black text-white rounded-lg hover:bg-black/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "验证中..." : "验证并保存"}
          </button>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          API Key 仅保存在浏览器本地，不会上传到任何服务器。
          <a
            href="https://console.bce.baidu.com/ai/#/ai/ocr/overview/index"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-black ml-1"
          >
            前往百度云获取
          </a>
        </p>
      </div>
    </div>
  );
}
