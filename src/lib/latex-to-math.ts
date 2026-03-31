import {
  MathRun,
  MathSuperScript,
  MathSubScript,
  MathFraction,
  Math as OoxmlMath,
} from "docx";

type MathChild =
  | MathRun
  | MathSuperScript
  | MathSubScript
  | MathFraction;

/**
 * Simple LaTeX → docx Math converter for common exam formulas.
 * Handles: subscripts, superscripts, fractions, basic symbols.
 * Falls back to plain MathRun for unrecognized tokens.
 */
export function latexToMath(latex: string): OoxmlMath {
  const children = parseLatex(latex.trim());
  return new OoxmlMath({ children });
}

// Symbol mapping
const SYMBOLS: Record<string, string> = {
  "\\cdot": "\u00B7",
  "\\times": "\u00D7",
  "\\div": "\u00F7",
  "\\pm": "\u00B1",
  "\\mp": "\u2213",
  "\\leq": "\u2264",
  "\\geq": "\u2265",
  "\\neq": "\u2260",
  "\\approx": "\u2248",
  "\\infty": "\u221E",
  "\\alpha": "\u03B1",
  "\\beta": "\u03B2",
  "\\gamma": "\u03B3",
  "\\delta": "\u03B4",
  "\\theta": "\u03B8",
  "\\lambda": "\u03BB",
  "\\mu": "\u03BC",
  "\\pi": "\u03C0",
  "\\sigma": "\u03C3",
  "\\omega": "\u03C9",
  "\\Omega": "\u03A9",
  "\\Delta": "\u0394",
  "\\Sigma": "\u03A3",
  "\\rightarrow": "\u2192",
  "\\leftarrow": "\u2190",
  "\\sqrt": "\u221A",
  "\\angle": "\u2220",
  "\\degree": "\u00B0",
  "\\circ": "\u00B0",
  "\\parallel": "\u2225",
  "\\perp": "\u22A5",
  "\\triangle": "\u25B3",
  "\\quad": "  ",
  "\\qquad": "    ",
  "\\,": " ",
  "\\;": " ",
  "\\!": "",
  "\\ ": " ",
};

function parseLatex(input: string): MathChild[] {
  const children: MathChild[] = [];
  let i = 0;

  while (i < input.length) {
    // Skip whitespace
    if (input[i] === " ") {
      i++;
      continue;
    }

    // Backslash commands
    if (input[i] === "\\") {
      // \\frac{a}{b}
      if (input.startsWith("\\frac", i)) {
        i += 5;
        const num = readGroup(input, i);
        i = num.end;
        const den = readGroup(input, i);
        i = den.end;
        children.push(
          new MathFraction({
            numerator: parseLatex(num.content),
            denominator: parseLatex(den.content),
          })
        );
        continue;
      }

      // Read command name
      let cmd = "\\";
      i++;
      while (i < input.length && /[a-zA-Z]/.test(input[i])) {
        cmd += input[i];
        i++;
      }

      // Check symbols
      if (SYMBOLS[cmd] !== undefined) {
        children.push(new MathRun(SYMBOLS[cmd]));
        continue;
      }

      // Unknown command — output as text
      children.push(new MathRun(cmd));
      continue;
    }

    // Superscript
    if (input[i] === "^") {
      i++;
      const sup = readGroupOrChar(input, i);
      i = sup.end;
      // Attach to previous child or empty base
      const base = children.length > 0 ? children.pop()! : new MathRun("");
      children.push(
        new MathSuperScript({
          children: [base],
          superScript: parseLatex(sup.content),
        })
      );
      continue;
    }

    // Subscript
    if (input[i] === "_") {
      i++;
      const sub = readGroupOrChar(input, i);
      i = sub.end;
      const base = children.length > 0 ? children.pop()! : new MathRun("");
      children.push(
        new MathSubScript({
          children: [base],
          subScript: parseLatex(sub.content),
        })
      );
      continue;
    }

    // Braces group (standalone)
    if (input[i] === "{") {
      const group = readGroup(input, i);
      i = group.end;
      children.push(...parseLatex(group.content));
      continue;
    }

    // Regular character
    // Collect consecutive regular chars
    let text = "";
    while (
      i < input.length &&
      !"\\^_{} ".includes(input[i])
    ) {
      text += input[i];
      i++;
    }
    if (text) {
      children.push(new MathRun(text));
    }
  }

  return children;
}

function readGroup(
  input: string,
  pos: number
): { content: string; end: number } {
  // Skip whitespace
  while (pos < input.length && input[pos] === " ") pos++;

  if (pos >= input.length || input[pos] !== "{") {
    // No braces — read single char or command
    return readGroupOrChar(input, pos);
  }

  // Find matching closing brace
  let depth = 0;
  let start = pos + 1;
  let i = pos;
  while (i < input.length) {
    if (input[i] === "{") depth++;
    else if (input[i] === "}") {
      depth--;
      if (depth === 0) {
        return { content: input.slice(start, i), end: i + 1 };
      }
    }
    i++;
  }
  // Unmatched brace — return rest
  return { content: input.slice(start), end: input.length };
}

function readGroupOrChar(
  input: string,
  pos: number
): { content: string; end: number } {
  while (pos < input.length && input[pos] === " ") pos++;

  if (pos >= input.length) return { content: "", end: pos };

  if (input[pos] === "{") return readGroup(input, pos);

  // Single character
  return { content: input[pos], end: pos + 1 };
}

/**
 * Check if a string contains LaTeX-like content.
 */
export function containsLatex(text: string): boolean {
  return /[\\^_{}]/.test(text) || /[A-Za-z]_\{/.test(text);
}
