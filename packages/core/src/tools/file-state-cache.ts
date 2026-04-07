/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'node:crypto';

/**
 * Records metadata about a file read operation.
 */
export interface FileReadRecord {
  /** Absolute path to the file */
  filePath: string;
  /** Timestamp of when the file was last read */
  readTimestamp: number;
  /** SHA-256 hash of the file content at read time */
  contentHash: string;
}

/**
 * Tracks file read state across tool invocations within a session.
 * Used to enforce read-before-edit: the edit tool checks this cache
 * to verify the model has read the file before attempting modifications.
 */
export class FileStateCache {
  private readonly readRecords = new Map<string, FileReadRecord>();

  /**
   * Record that a file has been read.
   * @param filePath Absolute path to the file
   * @param content The content that was read
   */
  recordRead(filePath: string, content: string): void {
    this.readRecords.set(filePath, {
      filePath,
      readTimestamp: Date.now(),
      contentHash: hashContent(content),
    });
  }

  /**
   * Record that a file has been written (counts as having been "read"
   * since the agent knows the current state of the file).
   * @param filePath Absolute path to the file
   * @param content The content that was written
   */
  recordWrite(filePath: string, content: string): void {
    this.recordRead(filePath, content);
  }

  /**
   * Check whether a file has been read in the current session.
   * @param filePath Absolute path to the file
   * @returns The read record, or undefined if the file has not been read
   */
  getReadRecord(filePath: string): FileReadRecord | undefined {
    return this.readRecords.get(filePath);
  }

  /**
   * Check whether a file has been read in the current session.
   * @param filePath Absolute path to the file
   * @returns true if the file has been read
   */
  hasBeenRead(filePath: string): boolean {
    return this.readRecords.has(filePath);
  }

  /**
   * Verify that the file content on disk matches what was last read.
   * @param filePath Absolute path to the file
   * @param currentContent The current content on disk
   * @returns true if the content matches the last read, false if it has changed
   */
  isContentCurrent(filePath: string, currentContent: string): boolean {
    const record = this.readRecords.get(filePath);
    if (!record) {
      return false;
    }
    return record.contentHash === hashContent(currentContent);
  }

  /**
   * Clear all records. Useful when resetting session state.
   */
  clear(): void {
    this.readRecords.clear();
  }

  /**
   * Remove a specific file's record.
   */
  remove(filePath: string): void {
    this.readRecords.delete(filePath);
  }
}

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}
