import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { stripAnsiCodes, ProgressIndicator, showSuccess, showError, showWarning, showInfo, createTable, formatParameterTable } from '../common';

describe('Common utilities', () => {
  describe('stripAnsiCodes', () => {
    test('should remove ANSI escape codes from string', () => {
      const input = '\x1b[31mRed text\x1b[0m and \x1b[32mgreen text\x1b[0m';
      const expected = 'Red text and green text';
      assert.equal(stripAnsiCodes(input), expected);
    });

    test('should handle empty string', () => {
      assert.equal(stripAnsiCodes(''), '');
    });

    test('should handle string without ANSI codes', () => {
      const input = 'Plain text without colors';
      assert.equal(stripAnsiCodes(input), input);
    });

    test('should handle complex ANSI sequences', () => {
      const input = '\x1b[1;31;42mBold red on green\x1b[0m';
      const expected = 'Bold red on green';
      assert.equal(stripAnsiCodes(input), expected);
    });
  });

  describe('ProgressIndicator', () => {
    test('should create ProgressIndicator instance', () => {
      const indicator = new ProgressIndicator();
      assert.ok(indicator);
      assert.equal(typeof indicator.start, 'function');
      assert.equal(typeof indicator.stop, 'function');
      assert.equal(typeof indicator.success, 'function');
      assert.equal(typeof indicator.error, 'function');
    });

    // Note: Testing the actual spinner output is tricky in a test environment
    // as it involves stdout manipulation and timers. These tests verify the API.
    test('should have start method', () => {
      const indicator = new ProgressIndicator();
      assert.equal(typeof indicator.start, 'function');
    });

    test('should have update method', () => {
      const indicator = new ProgressIndicator();
      assert.equal(typeof indicator.update, 'function');
    });

    test('should have stop method', () => {
      const indicator = new ProgressIndicator();
      assert.equal(typeof indicator.stop, 'function');
    });
  });

  describe('Display functions', () => {
    // These functions write to console.log, so we'll test that they don't throw errors
    test('showSuccess should not throw', () => {
      assert.doesNotThrow(() => showSuccess('Test message'));
    });

    test('showError should not throw', () => {
      assert.doesNotThrow(() => showError('Test message'));
    });

    test('showWarning should not throw', () => {
      assert.doesNotThrow(() => showWarning('Test message'));
    });

    test('showInfo should not throw', () => {
      assert.doesNotThrow(() => showInfo('Test message'));
    });
  });

  describe('createTable', () => {
    test('should create table with headers and rows', () => {
      const headers = ['Name', 'Age', 'City'];
      const rows = [
        ['John', '25', 'NYC'],
        ['Jane', '30', 'LA']
      ];
      const table = createTable(headers, rows);
      assert.ok(table.includes('Name'));
      assert.ok(table.includes('Age'));
      assert.ok(table.includes('City'));
      assert.ok(table.includes('John'));
      assert.ok(table.includes('Jane'));
      assert.ok(table.includes('│')); // Table separator
      assert.ok(table.includes('─')); // Table border
    });

    test('should handle empty rows', () => {
      const headers = ['Name', 'Age'];
      const rows: string[][] = [];
      const table = createTable(headers, rows);
      assert.equal(table, '');
    });

    test('should handle ANSI codes in cells', () => {
      const headers = ['Name', 'Status'];
      const rows = [['\x1b[32mJohn\x1b[0m', '\x1b[31mActive\x1b[0m']];
      const table = createTable(headers, rows);
      assert.ok(table.includes('John')); // ANSI codes should be stripped for width calculation
      assert.ok(table.includes('Active'));
    });
  });

  describe('formatParameterTable', () => {
    test('should format parameter table', () => {
      const params = [
        {
          name: 'input',
          type: 'string',
          description: 'Input file path',
          required: true,
          options: ['file1.txt', 'file2.txt']
        },
        {
          name: 'output',
          type: 'string',
          description: 'Output file path',
          required: false
        }
      ];
      const table = formatParameterTable(params);
      assert.ok(table.includes('Parameter'));
      assert.ok(table.includes('Type'));
      assert.ok(table.includes('Required'));
      assert.ok(table.includes('Description'));
      assert.ok(table.includes('input'));
      assert.ok(table.includes('output'));
      assert.ok(table.includes('string'));
      assert.ok(table.includes('Yes'));
      assert.ok(table.includes('No'));
      assert.ok(table.includes('Input file path'));
      assert.ok(table.includes('Output file path'));
      assert.ok(table.includes('file1.txt'));
      assert.ok(table.includes('file2.txt'));
    });

    test('should handle parameters without options', () => {
      const params = [
        {
          name: 'verbose',
          type: 'boolean',
          description: 'Enable verbose output',
          required: false
        }
      ];
      const table = formatParameterTable(params);
      assert.ok(table.includes('verbose'));
      assert.ok(table.includes('boolean'));
      assert.ok(table.includes('No'));
      assert.ok(table.includes('Enable verbose output'));
    });

    test('should handle parameters without type', () => {
      const params = [
        {
          name: 'data',
          description: 'Data parameter',
          required: true
        }
      ];
      const table = formatParameterTable(params);
      assert.ok(table.includes('data'));
      assert.ok(table.includes('text')); // Default type
      assert.ok(table.includes('Yes'));
      assert.ok(table.includes('Data parameter'));
    });
  });
});
