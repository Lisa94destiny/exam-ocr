# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

试卷 OCR — 批量上传试卷照片，通过百度 OCR API（doc_analysis）识别文字、版面、公式，导出为 Word 文档。

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 (via @tailwindcss/postcss)
- `docx` npm package for Word generation
- 百度 OCR doc_analysis API（用户自备 API Key，存 localStorage）

## Commands

- `npm run dev` — 启动开发服务器 (Turbopack)
- `npm run build` — 生产构建
- `npm run lint` — ESLint 检查

## Architecture

- `src/app/page.tsx` — 主页面，管理所有状态（图片列表、OCR 结果、配置）
- `src/app/api/token/route.ts` — 代理百度 OAuth token 获取
- `src/app/api/ocr/route.ts` — 代理百度 doc_analysis OCR 请求
- `src/app/api/export/route.ts` — 接收 OCR 结果 JSON，用 docx 包生成 .docx 返回
- `src/components/` — UI 组件（Header, ApiConfig, ImageUploader, ImagePreview, OcrResultCard）
- `src/lib/storage.ts` — localStorage 封装
- `src/lib/baidu-ocr.ts` — 前端调用 API routes 的封装
- `src/types/ocr.ts` — 百度 OCR 响应类型定义

## Design

黑白配色，无衬线字体（Inter + Noto Sans SC），高级感极简风格。
