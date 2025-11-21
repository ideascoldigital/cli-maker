import { Colors } from './colors';

export function stripAnsiCodes(str: string): string {
  // biome-ignore lint: This regex is safe and commonly used for ANSI escape codes
  return str.replace(/\u001b\[[0-9;]*[mG]/g, '');
}

export class ProgressIndicator {
  private interval: NodeJS.Timeout | null = null;
  private frameIndex = 0;

  start(message: string = 'Processing...'): void {
    process.stdout.write(`${Colors.Info}${Colors.SpinnerFrames[0]} ${message}${Colors.Reset}`);
    this.interval = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % Colors.SpinnerFrames.length;
      process.stdout.write(`\r${Colors.Info}${Colors.SpinnerFrames[this.frameIndex]} ${message}${Colors.Reset}`);
    }, 100);
  }

  update(message: string): void {
    if (this.interval) {
      process.stdout.write(`\r${Colors.Info}${Colors.SpinnerFrames[this.frameIndex]} ${message}${Colors.Reset}`);
    }
  }

  stop(success: boolean = true, finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;

      const icon = success ? '✅' : '❌';
      const color = success ? Colors.Success : Colors.Error;
      const message = finalMessage || (success ? 'Done!' : 'Failed!');

      // Clear the current line and move cursor to beginning
      process.stdout.write('\r\x1b[K');
      process.stdout.write(`${color}${icon} ${message}${Colors.Reset}\n`);
    }
  }

  success(message: string = 'Completed successfully!'): void {
    this.stop(true, message);
  }

  error(message: string = 'Operation failed!'): void {
    this.stop(false, message);
  }
}

export function showSuccess(message: string): void {
  console.log(`${Colors.Success}✅ ${message}${Colors.Reset}`);
}

export function showError(message: string): void {
  console.log(`${Colors.Error}❌ ${message}${Colors.Reset}`);
}

export function showWarning(message: string): void {
  console.log(`${Colors.Warning}⚠️  ${message}${Colors.Reset}`);
}

export function showInfo(message: string): void {
  console.log(`${Colors.Info}ℹ️  ${message}${Colors.Reset}`);
}

export function createTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '';

  const allRows = [headers, ...rows];
  const colWidths = headers.map((_, i) => Math.max(...allRows.map(row => stripAnsiCodes(row[i] || '').length)));

  const createRow = (row: string[]) => {
    return row.map((cell, i) => {
      const cleanCell = stripAnsiCodes(cell);
      return cell.padEnd(colWidths[i] + (cell.length - cleanCell.length));
    }).join(' │ ');
  };

  const separator = colWidths.map(width => '─'.repeat(width)).join('─┼─');

  let table = createRow(headers) + '\n';
  table += separator + '\n';
  table += rows.map(createRow).join('\n');

  return table;
}

export function formatParameterTable(params: Array<{name: string, type?: string, description: string, required?: boolean, options?: any[]}>): string {
  const headers = ['Parameter', 'Type', 'Required', 'Description'];
  const rows = params.map(param => [
    Colors.FgGreen + param.name + Colors.Reset,
    Colors.FgBlue + (param.type || 'text') + Colors.Reset,
    param.required ? Colors.FgRed + 'Yes' + Colors.Reset : Colors.FgGray + 'No' + Colors.Reset,
    param.description + (param.options ? `\n${Colors.FgGray}Options: ${param.options.join(', ')}${Colors.Reset}` : '')
  ]);

  return createTable(headers, rows);
}
