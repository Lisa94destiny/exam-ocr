import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "试卷 OCR - 照片转 Word",
  description: "批量上传试卷照片，智能识别并导出为 Word 文档",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
