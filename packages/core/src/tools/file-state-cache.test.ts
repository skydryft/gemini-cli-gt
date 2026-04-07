/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FileStateCache } from './file-state-cache.js';

describe('FileStateCache', () => {
  let cache: FileStateCache;

  beforeEach(() => {
    cache = new FileStateCache();
  });

  describe('recordRead', () => {
    it('should record a file read', () => {
      cache.recordRead('/path/to/file.ts', 'content');
      expect(cache.hasBeenRead('/path/to/file.ts')).toBe(true);
    });

    it('should not report unread files as read', () => {
      expect(cache.hasBeenRead('/path/to/other.ts')).toBe(false);
    });
  });

  describe('recordWrite', () => {
    it('should record a file write as a read', () => {
      cache.recordWrite('/path/to/file.ts', 'new content');
      expect(cache.hasBeenRead('/path/to/file.ts')).toBe(true);
    });
  });

  describe('isContentCurrent', () => {
    it('should return true when content matches last read', () => {
      cache.recordRead('/path/to/file.ts', 'original content');
      expect(
        cache.isContentCurrent('/path/to/file.ts', 'original content'),
      ).toBe(true);
    });

    it('should return false when content has changed', () => {
      cache.recordRead('/path/to/file.ts', 'original content');
      expect(
        cache.isContentCurrent('/path/to/file.ts', 'modified content'),
      ).toBe(false);
    });

    it('should return false for unrecorded files', () => {
      expect(cache.isContentCurrent('/path/to/unknown.ts', 'content')).toBe(
        false,
      );
    });

    it('should track the latest read when file is read multiple times', () => {
      cache.recordRead('/path/to/file.ts', 'first content');
      cache.recordRead('/path/to/file.ts', 'second content');
      expect(cache.isContentCurrent('/path/to/file.ts', 'second content')).toBe(
        true,
      );
      expect(cache.isContentCurrent('/path/to/file.ts', 'first content')).toBe(
        false,
      );
    });
  });

  describe('getReadRecord', () => {
    it('should return the read record with metadata', () => {
      cache.recordRead('/path/to/file.ts', 'content');
      const record = cache.getReadRecord('/path/to/file.ts');
      expect(record).toBeDefined();
      expect(record!.filePath).toBe('/path/to/file.ts');
      expect(record!.readTimestamp).toBeGreaterThan(0);
      expect(record!.contentHash).toBeTruthy();
    });

    it('should return undefined for unrecorded files', () => {
      expect(cache.getReadRecord('/path/to/unknown.ts')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all records', () => {
      cache.recordRead('/path/to/a.ts', 'a');
      cache.recordRead('/path/to/b.ts', 'b');
      cache.clear();
      expect(cache.hasBeenRead('/path/to/a.ts')).toBe(false);
      expect(cache.hasBeenRead('/path/to/b.ts')).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove a specific record', () => {
      cache.recordRead('/path/to/a.ts', 'a');
      cache.recordRead('/path/to/b.ts', 'b');
      cache.remove('/path/to/a.ts');
      expect(cache.hasBeenRead('/path/to/a.ts')).toBe(false);
      expect(cache.hasBeenRead('/path/to/b.ts')).toBe(true);
    });
  });
});
