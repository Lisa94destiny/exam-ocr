import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from "docx";
import { latexToMath, containsLatex } from "@/lib/latex-to-math";

export const runtime = "nodejs";

interface WordsLocation {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OcrWords {
  word: string;
  words_location?: WordsLocation;
}

interface OcrResult {
  words_type: string;
  words: OcrWords;
}

interface WordsResultItem {
  words: string;
  location?: WordsLocation;
}

interface OcrFormulaResult {
  form_words: string;
}

interface PageData {
  fileName: string;
  results: OcrResult[];
  words_result?: WordsResultItem[];
  formula_result?: OcrFormulaResult[];
  polishedText?: string | null;
}

interface PositionedItem {
  text: string;
  top: number;
  left: number;
  height: number;
  width: number;
}

function mergeByPosition(items: PositionedItem[]): string[] {
  if (items.length === 0) return [];

  items.sort((a, b) => a.top - b.top || a.left - b.left);

  const lines: PositionedItem[][] = [];
  let currentLine = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const avgHeight =
      currentLine.reduce((s, c) => s + c.height, 0) / currentLine.length;
    const threshold = avgHeight * 0.5;
    const lineTop =
      currentLine.reduce((s, c) => s + c.top, 0) / currentLine.length;

    if (Math.abs(item.top - lineTop) <= threshold) {
      currentLine.push(item);
    } else {
      lines.push(currentLine);
      currentLine = [item];
    }
  }
  lines.push(currentLine);

  return lines.map((line) => {
    line.sort((a, b) => a.left - b.left);
    let text = "";
    for (let i = 0; i < line.length; i++) {
      if (i === 0) {
        text = line[i].text;
      } else {
        const prevEnd = line[i - 1].left + line[i - 1].width;
        const gap = line[i].left - prevEnd;
        const avgCharWidth =
          line[i - 1].width / (line[i - 1].text.length || 1);
        text += gap > avgCharWidth * 0.8 ? " " + line[i].text : line[i].text;
      }
    }
    return text;
  });
}

function getMergedLines(page: PageData): string[] {
  if (page.words_result && page.words_result.length > 0) {
    const items = page.words_result
      .filter((item) => item.words && item.location)
      .map((item) => ({
        text: item.words,
        top: item.location!.top,
        left: item.location!.left,
        height: item.location!.height,
        width: item.location!.width,
      }));

    if (items.length > 0) return mergeByPosition(items);

    return page.words_result
      .filter((item) => item.words)
      .map((item) => item.words);
  }

  const results = page.results || [];
  const items = results
    .filter((r) => r.words?.word && r.words?.words_location)
    .map((r) => ({
      text: r.words.word,
      top: r.words.words_location!.top,
      left: r.words.words_location!.left,
      height: r.words.words_location!.height,
      width: r.words.words_location!.width,
    }));

  if (items.length > 0) return mergeByPosition(items);

  return results.filter((r) => r.words?.word).map((r) => r.words.word);
}

/**
 * Build paragraph children that mix text and inline math.
 * Splits on LaTeX-like fragments and converts them to Word native math.
 */
function buildLineChildren(
  line: string
): Array<TextRun | ReturnType<typeof latexToMath>> {
  // Try to detect inline LaTeX fragments (e.g. R_{1}, P=I^{2}\cdot R)
  // Split by segments that look like formulas
  const parts = splitTextAndFormula(line);
  const children: Array<TextRun | ReturnType<typeof latexToMath>> = [];

  for (const part of parts) {
    if (part.isFormula) {
      try {
        children.push(latexToMath(part.text));
      } catch {
        // Fallback to plain text if conversion fails
        children.push(
          new TextRun({ text: part.text, size: 22, font: "Microsoft YaHei" })
        );
      }
    } else {
      children.push(
        new TextRun({ text: part.text, size: 22, font: "Microsoft YaHei" })
      );
    }
  }

  return children;
}

interface TextPart {
  text: string;
  isFormula: boolean;
}

function splitTextAndFormula(line: string): TextPart[] {
  // If the line doesn't contain any LaTeX markers, return as plain text
  if (!containsLatex(line)) {
    return [{ text: line, isFormula: false }];
  }

  // Try to split around LaTeX-like segments
  // Match patterns like: X_{...}, X^{...}, \frac{...}{...}, \command
  const regex =
    /(?:[A-Za-z0-9]*[_^]\{[^}]*\}(?:\{[^}]*\})?(?:\s*[><=+\-]\s*[A-Za-z0-9]*[_^]\{[^}]*\})*|\\frac\{[^}]*\}\{[^}]*\}|\\[a-zA-Z]+)/g;

  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: line.slice(lastIndex, match.index),
        isFormula: false,
      });
    }
    parts.push({ text: match[0], isFormula: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push({ text: line.slice(lastIndex), isFormula: false });
  }

  return parts.length > 0 ? parts : [{ text: line, isFormula: false }];
}

function buildPageSection(page: PageData, pageIndex: number): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: pageIndex > 0 ? 400 : 0, after: 200 },
      children: [
        new TextRun({
          text: page.fileName || `第 ${pageIndex + 1} 页`,
          bold: true,
          size: 32,
          font: "Microsoft YaHei",
        }),
      ],
    })
  );

  // Use AI-polished text if available, otherwise OCR merged lines
  if (page.polishedText) {
    const polishedLines = page.polishedText.split("\n").filter((l) => l.trim());
    for (const line of polishedLines) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({
              text: line,
              size: 22,
              font: "Microsoft YaHei",
            }),
          ],
        })
      );
    }
  } else {
    const lines = getMergedLines(page);

    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: buildLineChildren(line),
        })
      );
    }
  }

  // Separate formula section (only when no polished text and no words_result)
  if (
    !page.polishedText &&
    !page.words_result?.length &&
    page.formula_result &&
    page.formula_result.length > 0
  ) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: "公式：",
            bold: true,
            size: 22,
            font: "Microsoft YaHei",
          }),
        ],
      })
    );
    for (const formula of page.formula_result) {
      try {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [latexToMath(formula.form_words)],
          })
        );
      } catch {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: formula.form_words,
                italics: true,
                size: 22,
                font: "Consolas",
              }),
            ],
          })
        );
      }
    }
  }

  return paragraphs;
}

export async function POST(request: NextRequest) {
  try {
    const { pages } = (await request.json()) as { pages: PageData[] };

    if (!pages || pages.length === 0) {
      return NextResponse.json(
        { error: "没有识别结果可导出" },
        { status: 400 }
      );
    }

    const allParagraphs: Paragraph[] = [];
    for (let i = 0; i < pages.length; i++) {
      allParagraphs.push(...buildPageSection(pages[i], i));
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: allParagraphs,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="exam-ocr-result.docx"`,
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "导出失败" },
      { status: 500 }
    );
  }
}
