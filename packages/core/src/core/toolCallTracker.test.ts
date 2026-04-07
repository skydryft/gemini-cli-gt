/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCallTracker } from './toolCallTracker.js';

describe('ToolCallTracker', () => {
  let tracker: ToolCallTracker;

  beforeEach(() => {
    tracker = new ToolCallTracker();
  });

  describe('failure repetition detection', () => {
    it('should detect consecutive failures of the same tool', () => {
      tracker.record('replace', 'hash1', false, 'old_string not found');
      tracker.record('replace', 'hash2', false, 'old_string not found');

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('failure_repetition');
      expect(result.detail).toContain('replace');
      expect(result.suggestion).toBeTruthy();
    });

    it('should not detect failure when tools are different', () => {
      tracker.record('replace', 'hash1', false, 'error');
      tracker.record('read_file', 'hash2', false, 'error');

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(false);
    });

    it('should not detect failure when last call succeeded', () => {
      tracker.record('replace', 'hash1', false, 'error');
      tracker.record('replace', 'hash2', true);

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(false);
    });

    it('should provide tool-specific suggestions for replace failures', () => {
      tracker.record('replace', 'hash1', false, 'not found');
      tracker.record('replace', 'hash2', false, 'not found');

      const result = tracker.checkPatterns();
      expect(result.suggestion).toContain('read_file');
    });

    it('should provide tool-specific suggestions for shell failures', () => {
      tracker.record('run_shell_command', 'hash1', false, 'command not found');
      tracker.record('run_shell_command', 'hash2', false, 'command not found');

      const result = tracker.checkPatterns();
      expect(result.suggestion).toContain('Break the command');
    });
  });

  describe('category repetition detection', () => {
    it('should detect same tool called many times consecutively', () => {
      for (let i = 0; i < 7; i++) {
        tracker.record('replace', `hash${i}`, true);
      }

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('category_repetition');
    });

    it('should not detect when different tools are used', () => {
      tracker.record('replace', 'h1', true);
      tracker.record('read_file', 'h2', true);
      tracker.record('replace', 'h3', true);
      tracker.record('read_file', 'h4', true);
      tracker.record('replace', 'h5', true);
      tracker.record('read_file', 'h6', true);
      tracker.record('replace', 'h7', true);

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(false);
    });

    it('should not detect with fewer calls than threshold', () => {
      for (let i = 0; i < 6; i++) {
        tracker.record('replace', `hash${i}`, true);
      }

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(false);
    });
  });

  describe('getConsecutiveFailureCount', () => {
    it('should count consecutive failures from the end', () => {
      tracker.record('replace', 'h1', true);
      tracker.record('replace', 'h2', false);
      tracker.record('replace', 'h3', false);
      tracker.record('replace', 'h4', false);

      expect(tracker.getConsecutiveFailureCount('replace')).toBe(3);
    });

    it('should stop counting at a success', () => {
      tracker.record('replace', 'h1', false);
      tracker.record('replace', 'h2', true);
      tracker.record('replace', 'h3', false);

      expect(tracker.getConsecutiveFailureCount('replace')).toBe(1);
    });

    it('should return 0 when no failures', () => {
      tracker.record('replace', 'h1', true);
      expect(tracker.getConsecutiveFailureCount('replace')).toBe(0);
    });
  });

  describe('sliding window', () => {
    it('should maintain a bounded history', () => {
      for (let i = 0; i < 30; i++) {
        tracker.record('read_file', `hash${i}`, true);
      }

      const records = tracker.getRecentRecords();
      expect(records.length).toBeLessThanOrEqual(20);
    });
  });

  describe('reset', () => {
    it('should clear all records', () => {
      tracker.record('replace', 'h1', false);
      tracker.record('replace', 'h2', false);
      tracker.reset();

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(false);
      expect(tracker.getRecentRecords().length).toBe(0);
    });
  });

  describe('priority', () => {
    it('should prioritize failure repetition over category repetition', () => {
      // Fill with 7 failures of the same tool (triggers both patterns)
      for (let i = 0; i < 7; i++) {
        tracker.record('replace', `hash${i}`, false, 'error');
      }

      const result = tracker.checkPatterns();
      expect(result.detected).toBe(true);
      expect(result.patternType).toBe('failure_repetition');
    });
  });
});
