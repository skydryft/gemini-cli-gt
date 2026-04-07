/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tracks tool call patterns across turns to detect failure loops,
 * category repetition, and provide strategy-switching guidance.
 *
 * This complements the existing LoopDetectionService (which operates at the
 * stream level) by tracking tool execution outcomes.
 */

/** Recorded outcome of a single tool call */
export interface ToolCallRecord {
  toolName: string;
  argsHash: string;
  timestamp: number;
  succeeded: boolean;
  errorMessage?: string;
}

/** Result of checking for problematic patterns */
export interface ToolCallPatternResult {
  /** Whether a problematic pattern was detected */
  detected: boolean;
  /** Type of pattern detected */
  patternType?: 'failure_repetition' | 'category_repetition';
  /** Human-readable description of the pattern */
  detail?: string;
  /** Suggested alternative approach */
  suggestion?: string;
}

// Thresholds
const FAILURE_REPETITION_THRESHOLD = 2;
const CATEGORY_REPETITION_THRESHOLD = 7;
const SLIDING_WINDOW_SIZE = 20;

/**
 * Tool-specific suggestions for when a tool fails repeatedly.
 * Maps tool names to suggested alternative approaches.
 */
const TOOL_ALTERNATIVES: Record<string, string> = {
  replace:
    'The replace tool has failed multiple times. Consider: (1) Use read_file to verify the exact current file contents. (2) Use write_file instead for large modifications. (3) Check that your old_string matches the file content exactly, including whitespace and indentation.',
  write_file:
    'write_file has failed multiple times. Check: (1) The file path is correct and within the workspace. (2) Parent directories exist. (3) You have the necessary permissions.',
  run_shell_command:
    'Shell command has failed multiple times. Try: (1) Break the command into smaller steps. (2) Check the current directory with pwd. (3) Verify required tools are installed. (4) Check for syntax errors in the command.',
  grep_search:
    'grep_search has failed or returned no results multiple times. Try: (1) Use a simpler or broader search pattern. (2) Use glob to find files by name pattern first. (3) Check that you are searching in the correct directory.',
  read_file:
    'read_file has failed multiple times. Check: (1) The file path is correct. (2) Use list_directory or glob to verify the file exists. (3) The file is within the workspace boundaries.',
};

/**
 * Generic suggestion when the same tool category is used excessively.
 */
const CATEGORY_REPETITION_SUGGESTIONS: Record<string, string> = {
  replace:
    'You have called replace many times consecutively. Step back and consider whether write_file would be more efficient for bulk changes, or if you should verify your approach is correct before making more edits.',
  run_shell_command:
    'You have run many shell commands consecutively. Consider whether you are making progress. If commands keep failing, re-read the error output carefully and try a fundamentally different approach.',
  read_file:
    'You have read many files consecutively. Consider using read_many_files or grep_search to find the information you need more efficiently.',
  grep_search:
    'You have run many searches consecutively. Consider whether you are looking for the right thing. Try using glob for file name patterns, or read_file if you know which file to examine.',
};

export class ToolCallTracker {
  private readonly records: ToolCallRecord[] = [];

  /**
   * Record a completed tool call.
   */
  record(
    toolName: string,
    argsHash: string,
    succeeded: boolean,
    errorMessage?: string,
  ): void {
    this.records.push({
      toolName,
      argsHash,
      timestamp: Date.now(),
      succeeded,
      errorMessage,
    });

    // Maintain sliding window
    if (this.records.length > SLIDING_WINDOW_SIZE) {
      this.records.splice(0, this.records.length - SLIDING_WINDOW_SIZE);
    }
  }

  /**
   * Check for problematic patterns in recent tool calls.
   * Should be called after each tool execution.
   */
  checkPatterns(): ToolCallPatternResult {
    // Check failure repetition first (higher priority)
    const failureResult = this.checkFailureRepetition();
    if (failureResult.detected) {
      return failureResult;
    }

    // Check category repetition
    return this.checkCategoryRepetition();
  }

  /**
   * Detect the same tool failing repeatedly with the same or similar args.
   */
  private checkFailureRepetition(): ToolCallPatternResult {
    if (this.records.length < FAILURE_REPETITION_THRESHOLD) {
      return { detected: false };
    }

    // Look at the most recent calls
    const recent = this.records.slice(-FAILURE_REPETITION_THRESHOLD);

    // All must be failures of the same tool
    const firstTool = recent[0].toolName;
    const allSameToolFailing = recent.every(
      (r) => r.toolName === firstTool && !r.succeeded,
    );

    if (!allSameToolFailing) {
      return { detected: false };
    }

    const suggestion =
      TOOL_ALTERNATIVES[firstTool] ||
      `The tool "${firstTool}" has failed ${FAILURE_REPETITION_THRESHOLD} times consecutively. Stop and try a fundamentally different approach. Consider using a different tool or strategy.`;

    return {
      detected: true,
      patternType: 'failure_repetition',
      detail: `Tool "${firstTool}" has failed ${FAILURE_REPETITION_THRESHOLD} consecutive times.`,
      suggestion,
    };
  }

  /**
   * Detect the same tool being called many times consecutively (even with different args).
   * This catches cases where the model is stuck in a single-tool strategy.
   */
  private checkCategoryRepetition(): ToolCallPatternResult {
    if (this.records.length < CATEGORY_REPETITION_THRESHOLD) {
      return { detected: false };
    }

    const recent = this.records.slice(-CATEGORY_REPETITION_THRESHOLD);
    const firstTool = recent[0].toolName;
    const allSameTool = recent.every((r) => r.toolName === firstTool);

    if (!allSameTool) {
      return { detected: false };
    }

    const suggestion =
      CATEGORY_REPETITION_SUGGESTIONS[firstTool] ||
      `You have called "${firstTool}" ${CATEGORY_REPETITION_THRESHOLD} times consecutively. Step back and reassess your strategy. Consider using different tools or a different approach.`;

    return {
      detected: true,
      patternType: 'category_repetition',
      detail: `Tool "${firstTool}" called ${CATEGORY_REPETITION_THRESHOLD} times consecutively.`,
      suggestion,
    };
  }

  /**
   * Get the count of recent consecutive failures for a specific tool.
   */
  getConsecutiveFailureCount(toolName: string): number {
    let count = 0;
    for (let i = this.records.length - 1; i >= 0; i--) {
      const record = this.records[i];
      if (record.toolName === toolName && !record.succeeded) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Reset the tracker. Called when a new prompt starts.
   */
  reset(): void {
    this.records.length = 0;
  }

  /**
   * Get a copy of recent records (for debugging/testing).
   */
  getRecentRecords(): readonly ToolCallRecord[] {
    return [...this.records];
  }
}
