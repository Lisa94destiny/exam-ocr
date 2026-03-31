"use client";

import { useState, useEffect } from "react";
import { AI_PROVIDERS, AiProvider, AiConfig as AiConfigType } from "@/types/ai";

interface AiConfigProps {
  open: boolean;
  onClose: () => void;
  config: AiConfigType | null;
  onSave: (config: AiConfigType) => void;
  onClear: () => void;
}

export default function AiConfig({
  open,
  onClose,
  config,
  onSave,
  onClear,
}: AiConfigProps) {
  const [provider, setProvider] = useState<AiProvider>(
    config?.provider || "aliyun"
  );
  const [apiKey, setApiKey] = useState(config?.apiKey || "");
  const [secretKey, setSecretKey] = useState(config?.secretKey || "");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || "");
  const [model, setModel] = useState(config?.model || "");

  const providerInfo = AI_PROVIDERS.find((p) => p.id === provider)!;

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setSecretKey(config.secretKey || "");
      setBaseUrl(config.baseUrl);
      setModel(config.model);
    }
  }, [config]);

  const handleProviderChange = (id: AiProvider) => {
    setProvider(id);
    const info = AI_PROVIDERS.find((p) => p.id === id)!;
    setBaseUrl(info.baseUrl);
    setModel(info.defaultModel);
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    if (provider === "baidu" && !secretKey.trim()) return;
    if (!model.trim()) return;

    onSave({
      provider,
      apiKey: apiKey.trim(),
      secretKey: provider === "baidu" ? secretKey.trim() : undefined,
      baseUrl: baseUrl.trim() || providerInfo.baseUrl,
      model: model.trim(),
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">AI 整理配置</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Provider select */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
              AI 供应商
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                    provider === p.id
                      ? "border-black bg-black text-white"
                      : "border-[var(--color-border)] hover:border-black/30"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入 API Key"
              className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
            />
          </div>

          {/* Secret Key (百度) */}
          {providerInfo.needsSecretKey && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
                Secret Key
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="输入 Secret Key"
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
            </div>
          )}

          {/* Model */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
              模型
            </label>
            {providerInfo.models.length > 0 ? (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
              >
                {providerInfo.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={
                  provider === "doubao"
                    ? "输入接入点 ID（如 ep-xxx）"
                    : "输入模型名称"
                }
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
            )}
          </div>

          {/* Base URL (for custom / override) */}
          {(provider === "custom" || provider === "doubao") && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--color-text-secondary)]">
                API Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
            </div>
          )}

          {config && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              已配置: {AI_PROVIDERS.find((p) => p.id === config.provider)?.name} / {config.model}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {config && (
            <button
              onClick={onClear}
              className="px-4 py-2.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            >
              清除
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 text-sm bg-black text-white rounded-lg hover:bg-black/85 transition-colors"
          >
            保存
          </button>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          API Key 仅保存在浏览器本地。AI 用于整理 OCR 结果中的错别字和排版。
        </p>
      </div>
    </div>
  );
}
