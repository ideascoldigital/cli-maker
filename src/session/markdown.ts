import { Colors } from '../colors';

/**
 * Render a markdown string to terminal-formatted output.
 * Supports: headers, bold, italic, inline code, fenced code blocks, lists, and horizontal rules.
 */
export function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code block toggle
    if (line.trimStart().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trimStart().slice(3).trim();
        codeLines = [];
        continue;
      } else {
        // End of code block — render it
        const header = codeBlockLang
          ? `${Colors.FgGray}┌─ ${codeBlockLang} ${'─'.repeat(Math.max(0, 40 - codeBlockLang.length))}┐${Colors.Reset}`
          : `${Colors.FgGray}┌${'─'.repeat(44)}┐${Colors.Reset}`;
        output.push(header);
        for (const cl of codeLines) {
          output.push(`${Colors.FgGray}│${Colors.Reset} ${Colors.FgCyan}${cl}${Colors.Reset}`);
        }
        const footer = `${Colors.FgGray}└${'─'.repeat(44)}┘${Colors.Reset}`;
        output.push(footer);
        inCodeBlock = false;
        codeBlockLang = '';
        codeLines = [];
        continue;
      }
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Horizontal rule
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      output.push(`${Colors.FgGray}${'─'.repeat(46)}${Colors.Reset}`);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = formatInline(headerMatch[2]);
      if (level === 1) {
        output.push(`\n${Colors.Bright}${Colors.FgCyan}${text}${Colors.Reset}`);
        output.push(`${Colors.FgGray}${'═'.repeat(stripAnsi(text).length)}${Colors.Reset}`);
      } else if (level === 2) {
        output.push(`\n${Colors.Bright}${Colors.FgGreen}${text}${Colors.Reset}`);
        output.push(`${Colors.FgGray}${'─'.repeat(stripAnsi(text).length)}${Colors.Reset}`);
      } else {
        output.push(`\n${Colors.Bright}${Colors.FgYellow}${text}${Colors.Reset}`);
      }
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    if (ulMatch) {
      const indent = ulMatch[1];
      const text = formatInline(ulMatch[3]);
      output.push(`${indent}${Colors.FgCyan}•${Colors.Reset} ${text}`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const indent = olMatch[1];
      const num = olMatch[2];
      const text = formatInline(olMatch[3]);
      output.push(`${indent}${Colors.FgCyan}${num}.${Colors.Reset} ${text}`);
      continue;
    }

    // Blockquote
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      const text = formatInline(bqMatch[1]);
      output.push(`${Colors.FgGray}│${Colors.Reset} ${Colors.Dim}${text}${Colors.Reset}`);
      continue;
    }

    // Regular paragraph line
    output.push(formatInline(line));
  }

  // If we ended while still inside a code block, flush it
  if (inCodeBlock && codeLines.length > 0) {
    const header = codeBlockLang
      ? `${Colors.FgGray}┌─ ${codeBlockLang} ${'─'.repeat(Math.max(0, 40 - codeBlockLang.length))}┐${Colors.Reset}`
      : `${Colors.FgGray}┌${'─'.repeat(44)}┐${Colors.Reset}`;
    output.push(header);
    for (const cl of codeLines) {
      output.push(`${Colors.FgGray}│${Colors.Reset} ${Colors.FgCyan}${cl}${Colors.Reset}`);
    }
    const footer = `${Colors.FgGray}└${'─'.repeat(44)}┘${Colors.Reset}`;
    output.push(footer);
  }

  return output.join('\n');
}

/**
 * Format inline markdown: bold, italic, inline code, strikethrough, links.
 */
function formatInline(text: string): string {
  // Inline code (must come before bold/italic to avoid conflicts)
  text = text.replace(/`([^`]+)`/g, `${Colors.FgCyan}$1${Colors.Reset}`);

  // Bold + italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, `${Colors.Bright}${Colors.Dim}$1${Colors.Reset}`);

  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, `${Colors.Bright}$1${Colors.Reset}`);
  text = text.replace(/__(.+?)__/g, `${Colors.Bright}$1${Colors.Reset}`);

  // Italic
  text = text.replace(/\*(.+?)\*/g, `${Colors.Dim}$1${Colors.Reset}`);
  text = text.replace(/_(.+?)_/g, `${Colors.Dim}$1${Colors.Reset}`);

  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, `${Colors.FgGray}$1${Colors.Reset}`);

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `${Colors.FgBlue}${Colors.Underscore}$1${Colors.Reset} ${Colors.FgGray}($2)${Colors.Reset}`);

  return text;
}

/**
 * Strip ANSI escape codes from a string (for length calculations).
 */
function stripAnsi(str: string): string {
  // biome-ignore lint: safe regex for ANSI codes
  return str.replace(/\u001b\[[0-9;]*[mG]/g, '');
}
