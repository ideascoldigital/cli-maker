import { Colors } from '../colors';
import { stripAnsiCodes } from '../common';

// ---------------------------------------------------------------------------
// Box drawing helpers
// ---------------------------------------------------------------------------

export interface BoxOptions {
  borderColor?: string;
  borderStyle?: 'single' | 'double' | 'dashed' | 'rounded';
  padding?: number;
  title?: string;
  titleColor?: string;
  maxWidth?: number;
}

const BORDERS = {
  single:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double:  { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  dashed:  { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '╌', v: '╎' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
};

/**
 * Draw a box around content lines with optional title.
 */
export function drawBox(contentLines: string[], opts: BoxOptions = {}): string {
  const border = BORDERS[opts.borderStyle ?? 'rounded'];
  const bColor = opts.borderColor ?? Colors.FgGray;
  const pad = opts.padding ?? 1;
  const termWidth = process.stdout.columns || 80;
  const maxW = opts.maxWidth ?? termWidth - 4;

  const contentWidths = contentLines.map(l => stripAnsiCodes(l).length);
  let innerWidth = Math.max(...contentWidths, 10);

  if (opts.title) {
    innerWidth = Math.max(innerWidth, stripAnsiCodes(opts.title).length + 4);
  }
  innerWidth = Math.min(innerWidth, maxW - pad * 2 - 2);

  const totalInner = innerWidth + pad * 2;
  const padStr = ' '.repeat(pad);

  const output: string[] = [];

  // Top border
  if (opts.title) {
    const tColor = opts.titleColor ?? Colors.Bright;
    const titleClean = stripAnsiCodes(opts.title);
    const remaining = Math.max(0, totalInner - titleClean.length - 3);
    output.push(`${bColor}${border.tl}${border.h} ${Colors.Reset}${tColor}${opts.title}${Colors.Reset}${bColor} ${border.h.repeat(remaining)}${border.tr}${Colors.Reset}`);
  } else {
    output.push(`${bColor}${border.tl}${border.h.repeat(totalInner)}${border.tr}${Colors.Reset}`);
  }

  // Content lines
  for (const line of contentLines) {
    const cleanLen = stripAnsiCodes(line).length;
    const rightPad = Math.max(0, innerWidth - cleanLen);
    output.push(`${bColor}${border.v}${Colors.Reset}${padStr}${line}${' '.repeat(rightPad)}${padStr}${bColor}${border.v}${Colors.Reset}`);
  }

  // Bottom border
  output.push(`${bColor}${border.bl}${border.h.repeat(totalInner)}${border.br}${Colors.Reset}`);

  return output.join('\n');
}

/**
 * Draw a two-column box panel (like Claude Code's welcome screen).
 * Spans the full terminal width with a ~45%/55% column split.
 */
export function drawTwoColumnBox(
  leftLines: string[],
  rightLines: string[],
  opts: BoxOptions & { dividerChar?: string; leftRatio?: number } = {}
): string {
  const border = BORDERS[opts.borderStyle ?? 'rounded'];
  const bColor = opts.borderColor ?? Colors.FgGray;
  const pad = opts.padding ?? 1;
  const termWidth = process.stdout.columns || 80;
  const maxW = opts.maxWidth ?? termWidth;

  // Total inner width = maxW - 2 (for left + right border chars)
  const totalInner = maxW - 2;

  // Column split: left gets ~45%, right gets ~55% (minus divider and padding)
  const ratio = opts.leftRatio ?? 0.45;
  const divider = opts.dividerChar ?? border.v;
  // Layout: pad + leftW + pad + divider + pad + rightW + pad
  const overhead = pad * 4 + 1; // 4 pads + 1 divider
  const usable = totalInner - overhead;
  const leftW = Math.max(10, Math.floor(usable * ratio));
  const rightW = Math.max(10, usable - leftW);

  const maxRows = Math.max(leftLines.length, rightLines.length);
  const padStr = ' '.repeat(pad);

  // Truncate a string (with ANSI) to fit a given visible width
  const truncate = (s: string, maxLen: number): string => {
    const clean = stripAnsiCodes(s);
    if (clean.length <= maxLen) return s;
    // Simple truncation: walk the string and count visible chars
    let visible = 0;
    let i = 0;
    let inEsc = false;
    let result = '';
    while (i < s.length && visible < maxLen - 1) {
      if (s[i] === '\x1b') {
        inEsc = true;
        result += s[i];
      } else if (inEsc) {
        result += s[i];
        if (/[a-zA-Z]/.test(s[i])) inEsc = false;
      } else {
        result += s[i];
        visible++;
      }
      i++;
    }
    return result + '\u2026' + Colors.Reset;
  };

  const output: string[] = [];

  // Top border with optional title
  if (opts.title) {
    const tColor = opts.titleColor ?? Colors.Bright;
    const titleClean = stripAnsiCodes(opts.title);
    const remaining = Math.max(0, totalInner - titleClean.length - 4);
    output.push(`${bColor}${border.tl}${border.h}${border.h}${border.h} ${Colors.Reset}${tColor}${opts.title}${Colors.Reset}${bColor} ${border.h.repeat(remaining)}${border.tr}${Colors.Reset}`);
  } else {
    output.push(`${bColor}${border.tl}${border.h.repeat(totalInner)}${border.tr}${Colors.Reset}`);
  }

  // Rows
  for (let i = 0; i < maxRows; i++) {
    const rawLeft = leftLines[i] ?? '';
    const rawRight = rightLines[i] ?? '';
    const left = truncate(rawLeft, leftW);
    const right = truncate(rawRight, rightW);
    const leftClean = stripAnsiCodes(left).length;
    const rightClean = stripAnsiCodes(right).length;
    const leftPadR = Math.max(0, leftW - leftClean);
    const rightPadR = Math.max(0, rightW - rightClean);

    output.push(
      `${bColor}${border.v}${Colors.Reset}${padStr}${left}${' '.repeat(leftPadR)}${padStr}${bColor}${divider}${Colors.Reset}${padStr}${right}${' '.repeat(rightPadR)}${padStr}${bColor}${border.v}${Colors.Reset}`
    );
  }

  // Bottom border
  output.push(`${bColor}${border.bl}${border.h.repeat(totalInner)}${border.br}${Colors.Reset}`);

  return output.join('\n');
}

/**
 * Render an info bar (single line with dim background).
 */
export function infoBar(text: string): string {
  return `${Colors.FgGray}${text}${Colors.Reset}`;
}

/**
 * Render a separator line.
 */
export function separator(char: string = '─', width?: number): string {
  const w = width ?? (process.stdout.columns || 80) - 2;
  return `${Colors.FgGray}${char.repeat(w)}${Colors.Reset}`;
}

/**
 * Render a tool call header (Claude-style ⏺ indicator with left accent).
 */
export function toolCallHeader(toolName: string, description: string): string {
  return `  ${Colors.FgYellow}⏺${Colors.Reset}  ${Colors.Bright}${toolName}${Colors.Reset}`;
}

/**
 * Render a tool call argument list.
 */
export function toolCallArgs(args: Record<string, any>): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(args)) {
    const display = typeof val === 'string' ? val : JSON.stringify(val);
    lines.push(`     ${Colors.FgGray}${key}:${Colors.Reset} ${display}`);
  }
  return lines.join('\n');
}

/**
 * Render a tool result box (indented, with subtle border).
 */
export function toolResultBox(result: string): string {
  const lines = result.split('\n');
  const output: string[] = [];
  for (const line of lines) {
    output.push(`     ${Colors.FgGray}│${Colors.Reset} ${line}`);
  }
  return output.join('\n');
}

/**
 * Render a section header with aligned items (for /help, /tools).
 */
export function sectionHeader(title: string): string {
  return `\n  ${Colors.Bright}${Colors.FgCyan}${title}${Colors.Reset}`;
}

/**
 * Render aligned key-value rows (for /help listing).
 * Automatically calculates the widest key for alignment.
 */
export function alignedList(
  items: Array<{ key: string; value: string; keyColor?: string; prefix?: string }>,
  indent: number = 4
): string {
  const indentStr = ' '.repeat(indent);
  const maxKeyLen = Math.max(...items.map(i => stripAnsiCodes(i.prefix ?? '').length + stripAnsiCodes(i.key).length));
  const gap = 3;
  const lines: string[] = [];
  for (const item of items) {
    const prefix = item.prefix ?? '';
    const prefixClean = stripAnsiCodes(prefix).length;
    const keyClean = stripAnsiCodes(item.key).length;
    const keyColor = item.keyColor ?? Colors.FgGreen;
    const padding = ' '.repeat(Math.max(1, maxKeyLen - prefixClean - keyClean + gap));
    lines.push(`${indentStr}${prefix}${keyColor}${item.key}${Colors.Reset}${padding}${Colors.FgGray}${item.value}${Colors.Reset}`);
  }
  return lines.join('\n');
}
