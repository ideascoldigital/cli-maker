import test from 'node:test';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Colors } from '../colors';

describe('Colors', () => {
  describe('ANSI escape codes', () => {
    test('should have Reset code', () => {
      assert.equal(typeof Colors.Reset, 'string');
      assert.ok(Colors.Reset.length > 0);
      assert.ok(Colors.Reset.includes('\x1b[0m'));
    });

    test('should have Bright modifier', () => {
      assert.equal(typeof Colors.Bright, 'string');
      assert.ok(Colors.Bright.length > 0);
      assert.ok(Colors.Bright.includes('\x1b[1m'));
    });

    test('should have Dim modifier', () => {
      assert.equal(typeof Colors.Dim, 'string');
      assert.ok(Colors.Dim.length > 0);
      assert.ok(Colors.Dim.includes('\x1b[2m'));
    });

    test('should have Underscore modifier', () => {
      assert.equal(typeof Colors.Underscore, 'string');
      assert.ok(Colors.Underscore.length > 0);
      assert.ok(Colors.Underscore.includes('\x1b[4m'));
    });

    test('should have Blink modifier', () => {
      assert.equal(typeof Colors.Blink, 'string');
      assert.ok(Colors.Blink.length > 0);
      assert.ok(Colors.Blink.includes('\x1b[5m'));
    });

    test('should have Reverse modifier', () => {
      assert.equal(typeof Colors.Reverse, 'string');
      assert.ok(Colors.Reverse.length > 0);
      assert.ok(Colors.Reverse.includes('\x1b[7m'));
    });

    test('should have Hidden modifier', () => {
      assert.equal(typeof Colors.Hidden, 'string');
      assert.ok(Colors.Hidden.length > 0);
      assert.ok(Colors.Hidden.includes('\x1b[8m'));
    });
  });

  describe('Foreground colors', () => {
    test('should have FgBlack', () => {
      assert.equal(typeof Colors.FgBlack, 'string');
      assert.ok(Colors.FgBlack.includes('\x1b[30m'));
    });

    test('should have FgRed', () => {
      assert.equal(typeof Colors.FgRed, 'string');
      assert.ok(Colors.FgRed.includes('\x1b[31m'));
    });

    test('should have FgGreen', () => {
      assert.equal(typeof Colors.FgGreen, 'string');
      assert.ok(Colors.FgGreen.includes('\x1b[32m'));
    });

    test('should have FgYellow', () => {
      assert.equal(typeof Colors.FgYellow, 'string');
      assert.ok(Colors.FgYellow.includes('\x1b[33m'));
    });

    test('should have FgBlue', () => {
      assert.equal(typeof Colors.FgBlue, 'string');
      assert.ok(Colors.FgBlue.includes('\x1b[34m'));
    });

    test('should have FgMagenta', () => {
      assert.equal(typeof Colors.FgMagenta, 'string');
      assert.ok(Colors.FgMagenta.includes('\x1b[35m'));
    });

    test('should have FgCyan', () => {
      assert.equal(typeof Colors.FgCyan, 'string');
      assert.ok(Colors.FgCyan.includes('\x1b[36m'));
    });

    test('should have FgWhite', () => {
      assert.equal(typeof Colors.FgWhite, 'string');
      assert.ok(Colors.FgWhite.includes('\x1b[37m'));
    });

    test('should have FgGray', () => {
      assert.equal(typeof Colors.FgGray, 'string');
      assert.ok(Colors.FgGray.includes('\x1b[90m'));
    });
  });

  describe('Background colors', () => {
    test('should have BgBlack', () => {
      assert.equal(typeof Colors.BgBlack, 'string');
      assert.ok(Colors.BgBlack.includes('\x1b[40m'));
    });

    test('should have BgRed', () => {
      assert.equal(typeof Colors.BgRed, 'string');
      assert.ok(Colors.BgRed.includes('\x1b[41m'));
    });

    test('should have BgGreen', () => {
      assert.equal(typeof Colors.BgGreen, 'string');
      assert.ok(Colors.BgGreen.includes('\x1b[42m'));
    });

    test('should have BgYellow', () => {
      assert.equal(typeof Colors.BgYellow, 'string');
      assert.ok(Colors.BgYellow.includes('\x1b[43m'));
    });

    test('should have BgBlue', () => {
      assert.equal(typeof Colors.BgBlue, 'string');
      assert.ok(Colors.BgBlue.includes('\x1b[44m'));
    });

    test('should have BgMagenta', () => {
      assert.equal(typeof Colors.BgMagenta, 'string');
      assert.ok(Colors.BgMagenta.includes('\x1b[45m'));
    });

    test('should have BgCyan', () => {
      assert.equal(typeof Colors.BgCyan, 'string');
      assert.ok(Colors.BgCyan.includes('\x1b[46m'));
    });

    test('should have BgWhite', () => {
      assert.equal(typeof Colors.BgWhite, 'string');
      assert.ok(Colors.BgWhite.includes('\x1b[47m'));
    });
  });

  describe('Status colors', () => {
    test('should have Success color', () => {
      assert.equal(typeof Colors.Success, 'string');
      assert.ok(Colors.Success.includes('\x1b[32m')); // Green
    });

    test('should have Error color', () => {
      assert.equal(typeof Colors.Error, 'string');
      assert.ok(Colors.Error.includes('\x1b[31m')); // Red
    });

    test('should have Warning color', () => {
      assert.equal(typeof Colors.Warning, 'string');
      assert.ok(Colors.Warning.includes('\x1b[33m')); // Yellow
    });

    test('should have Info color', () => {
      assert.equal(typeof Colors.Info, 'string');
      assert.ok(Colors.Info.includes('\x1b[36m')); // Cyan
    });
  });

  describe('Spinner frames', () => {
    test('should have SpinnerFrames array', () => {
      assert.ok(Array.isArray(Colors.SpinnerFrames));
      assert.ok(Colors.SpinnerFrames.length > 0);
    });

    test('should have valid spinner characters', () => {
      Colors.SpinnerFrames.forEach(frame => {
        assert.equal(typeof frame, 'string');
        assert.ok(frame.length > 0);
      });
    });
  });

  describe('Color combinations', () => {
    test('should combine colors correctly', () => {
      const coloredText = Colors.FgRed + Colors.BgWhite + 'Test' + Colors.Reset;
      assert.ok(coloredText.includes('\x1b[31m')); // Red foreground
      assert.ok(coloredText.includes('\x1b[47m')); // White background
      assert.ok(coloredText.includes('\x1b[0m'));  // Reset
      assert.ok(coloredText.includes('Test'));     // Content
    });

    test('should handle bright colors', () => {
      const brightText = Colors.Bright + Colors.FgGreen + 'Bright Green' + Colors.Reset;
      assert.ok(brightText.includes('\x1b[1m'));  // Bright
      assert.ok(brightText.includes('\x1b[32m')); // Green
      assert.ok(brightText.includes('\x1b[0m'));  // Reset
    });
  });
});
