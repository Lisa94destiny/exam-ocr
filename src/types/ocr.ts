export interface OcrWordsLocation {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface OcrWord {
  word: string;
  words_location: OcrWordsLocation;
}

export interface OcrWords {
  word: string;
  words_location: OcrWordsLocation;
}

export interface OcrResult {
  words_type: string;
  words: OcrWords;
}

export interface OcrFormulaResult {
  form_location: Array<{ x: number; y: number }>;
  form_words: string;
}

export interface OcrLayoutLocation {
  x: number;
  y: number;
}

export interface OcrLayout {
  layout: "table" | "figure" | "text" | "title" | "contents";
  layout_location: OcrLayoutLocation[];
  layout_idx: number[];
}

// words_result: merged text+formula lines (returned when recg_formula=true)
export interface OcrWordsResultItem {
  words: string;
  location: OcrWordsLocation;
}

export interface OcrResponse {
  log_id: number;
  results_num: number;
  results: OcrResult[];
  formula_result?: OcrFormulaResult[];
  words_result?: OcrWordsResultItem[];
  layouts_num?: number;
  layouts?: OcrLayout[];
  img_direction?: number;
  error_code?: number;
  error_msg?: string;
}

export interface ImageItem {
  id: string;
  file: File;
  preview: string;
  base64: string;
  status: "pending" | "processing" | "done" | "error";
  ocrResult?: OcrResponse;
  errorMsg?: string;
}

export interface ApiConfig {
  apiKey: string;
  secretKey: string;
  accessToken: string;
}
