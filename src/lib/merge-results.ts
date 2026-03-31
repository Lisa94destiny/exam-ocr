import type { OcrResult, OcrWordsResultItem } from "@/types/ocr";

export interface MergedLine {
  text: string;
  top: number;
  left: number;
}

/**
 * Merge OCR results into clean lines.
 * Prefers words_result (text+formula merged) when available.
 * Falls back to merging raw results by coordinate.
 */
export function mergeOcrResults(
  results: OcrResult[],
  wordsResult?: OcrWordsResultItem[]
): MergedLine[] {
  // Prefer words_result — it already has formulas merged inline
  if (wordsResult && wordsResult.length > 0) {
    return mergeWordsResult(wordsResult);
  }

  // Fallback: merge raw results by position
  return mergeRawResults(results);
}

function mergeWordsResult(items: OcrWordsResultItem[]): MergedLine[] {
  if (!items || items.length === 0) return [];

  const positioned = items
    .filter((item) => item.words && item.location)
    .map((item) => ({
      text: item.words,
      top: item.location.top,
      left: item.location.left,
      height: item.location.height,
      width: item.location.width,
    }));

  if (positioned.length === 0) {
    return items
      .filter((item) => item.words)
      .map((item) => ({ text: item.words, top: 0, left: 0 }));
  }

  return mergeByPosition(positioned);
}

function mergeRawResults(results: OcrResult[]): MergedLine[] {
  if (!results || results.length === 0) return [];

  const items = results
    .filter((r) => r.words?.word && r.words?.words_location)
    .map((r) => ({
      text: r.words.word,
      top: r.words.words_location.top,
      left: r.words.words_location.left,
      height: r.words.words_location.height,
      width: r.words.words_location.width,
    }));

  if (items.length === 0) {
    return results
      .filter((r) => r.words?.word)
      .map((r) => ({ text: r.words.word, top: 0, left: 0 }));
  }

  return mergeByPosition(items);
}

interface PositionedItem {
  text: string;
  top: number;
  left: number;
  height: number;
  width: number;
}

function mergeByPosition(items: PositionedItem[]): MergedLine[] {
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

    return {
      text,
      top: Math.min(...line.map((l) => l.top)),
      left: Math.min(...line.map((l) => l.left)),
    };
  });
}
