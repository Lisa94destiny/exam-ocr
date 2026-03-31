"use client";

import { useCallback, useRef } from "react";

interface ImageUploaderProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export default function ImageUploader({
  onFilesAdded,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const validFiles = Array.from(fileList).filter((f) =>
        ["image/jpeg", "image/png", "image/bmp", "image/jpg"].includes(f.type)
      );
      if (validFiles.length > 0) onFilesAdded(validFiles);
    },
    [onFilesAdded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dropRef.current?.classList.remove("drag-active");
      if (!disabled) handleFiles(e.dataTransfer.files);
    },
    [handleFiles, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) dropRef.current?.classList.add("drag-active");
    },
    [disabled]
  );

  const handleDragLeave = useCallback(() => {
    dropRef.current?.classList.remove("drag-active");
  }, []);

  return (
    <div
      ref={dropRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        border-2 border-dashed border-[var(--color-border)] rounded-2xl
        p-12 text-center cursor-pointer transition-all duration-200
        hover:border-black/30 hover:bg-[var(--color-surface)]
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/bmp"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">
            拖拽图片到此处，或{" "}
            <span className="text-black underline underline-offset-2">
              点击上传
            </span>
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
            支持 JPG、PNG、BMP 格式，可多选
          </p>
        </div>
      </div>
    </div>
  );
}
