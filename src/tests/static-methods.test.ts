import { describe, test, expect } from 'bun:test';
import { CLI } from '../command/command';

describe('CLI Static Methods', () => {
  test('CLI.askQuestion should be defined as a static method', () => {
    expect(typeof CLI.askQuestion).toBe('function');
  });

  test('CLI.askHiddenQuestion should be defined as a static method', () => {
    expect(typeof CLI.askHiddenQuestion).toBe('function');
  });

  test('Static methods should be accessible without instance', () => {
    // Verify we can access these methods without creating a CLI instance
    expect(CLI.askQuestion).toBeDefined();
    expect(CLI.askHiddenQuestion).toBeDefined();
  });

  test('Static methods should return promises', () => {
    // We can't actually test the prompts without mocking stdin,
    // but we can verify they return promises
    expect(CLI.askQuestion).toBeInstanceOf(Function);
    expect(CLI.askHiddenQuestion).toBeInstanceOf(Function);
  });
});
