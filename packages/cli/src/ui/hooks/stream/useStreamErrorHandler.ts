/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useCallback } from 'react';
import {
  DEFAULT_GEMINI_FLASH_MODEL,
  parseAndFormatApiError,
} from '@google/gemini-cli-core';
import type {
  Config,
  GeminiErrorEventValue,
  ThoughtSummary,
} from '@google/gemini-cli-core';
import { MessageType, type HistoryItemWithoutId } from '../../types.js';
import type { UseHistoryManagerReturn } from '../useHistoryManager.js';

export const SUPPRESSED_TOOL_ERRORS_NOTE =
  'Some internal tool attempts failed before this final error. Press F12 for diagnostics, or run /settings and change "Error Verbosity" to full for details.';
export const LOW_VERBOSITY_FAILURE_NOTE =
  'This request failed. Press F12 for diagnostics, or run /settings and change "Error Verbosity" to full for full details.';

export interface UseStreamErrorHandlerDeps {
  config: Config;
  addItem: UseHistoryManagerReturn['addItem'];
  isLowErrorVerbosity: boolean;
  pendingHistoryItemRef: React.MutableRefObject<HistoryItemWithoutId | null>;
  setPendingHistoryItem: (value: HistoryItemWithoutId | null) => void;
  setThought: (value: ThoughtSummary | null) => void;
}

export interface UseStreamErrorHandlerReturn {
  handleErrorEvent: (
    eventValue: GeminiErrorEventValue,
    userMessageTimestamp: number,
  ) => void;
  maybeAddSuppressedToolErrorNote: (userMessageTimestamp?: number) => void;
  maybeAddLowVerbosityFailureNote: (userMessageTimestamp?: number) => void;
  suppressedToolErrorCountRef: React.MutableRefObject<number>;
  suppressedToolErrorNoteShownRef: React.MutableRefObject<boolean>;
  lowVerbosityFailureNoteShownRef: React.MutableRefObject<boolean>;
}

/**
 * Extracted from useGeminiStream — handles error display logic including
 * suppressed tool error notes and low verbosity failure notes.
 */
export function useStreamErrorHandler(
  deps: UseStreamErrorHandlerDeps,
): UseStreamErrorHandlerReturn {
  const {
    config,
    addItem,
    isLowErrorVerbosity,
    pendingHistoryItemRef,
    setPendingHistoryItem,
    setThought,
  } = deps;

  const suppressedToolErrorCountRef = useRef(0);
  const suppressedToolErrorNoteShownRef = useRef(false);
  const lowVerbosityFailureNoteShownRef = useRef(false);

  const maybeAddSuppressedToolErrorNote = useCallback(
    (userMessageTimestamp?: number) => {
      if (!isLowErrorVerbosity) {
        return;
      }
      if (suppressedToolErrorCountRef.current === 0) {
        return;
      }
      if (suppressedToolErrorNoteShownRef.current) {
        return;
      }

      addItem(
        {
          type: MessageType.INFO,
          text: SUPPRESSED_TOOL_ERRORS_NOTE,
        },
        userMessageTimestamp,
      );
      suppressedToolErrorNoteShownRef.current = true;
    },
    [addItem, isLowErrorVerbosity],
  );

  const maybeAddLowVerbosityFailureNote = useCallback(
    (userMessageTimestamp?: number) => {
      if (!isLowErrorVerbosity || config.getDebugMode()) {
        return;
      }
      if (
        lowVerbosityFailureNoteShownRef.current ||
        suppressedToolErrorNoteShownRef.current
      ) {
        return;
      }

      addItem(
        {
          type: MessageType.INFO,
          text: LOW_VERBOSITY_FAILURE_NOTE,
        },
        userMessageTimestamp,
      );
      lowVerbosityFailureNoteShownRef.current = true;
    },
    [addItem, config, isLowErrorVerbosity],
  );

  const handleErrorEvent = useCallback(
    (eventValue: GeminiErrorEventValue, userMessageTimestamp: number) => {
      if (pendingHistoryItemRef.current) {
        addItem(pendingHistoryItemRef.current, userMessageTimestamp);
        setPendingHistoryItem(null);
      }
      maybeAddSuppressedToolErrorNote(userMessageTimestamp);
      addItem(
        {
          type: MessageType.ERROR,
          text: parseAndFormatApiError(
            eventValue.error,
            config.getContentGeneratorConfig()?.authType,
            undefined,
            config.getModel(),
            DEFAULT_GEMINI_FLASH_MODEL,
          ),
        },
        userMessageTimestamp,
      );
      maybeAddLowVerbosityFailureNote(userMessageTimestamp);
      setThought(null);
    },
    [
      addItem,
      pendingHistoryItemRef,
      setPendingHistoryItem,
      config,
      setThought,
      maybeAddSuppressedToolErrorNote,
      maybeAddLowVerbosityFailureNote,
    ],
  );

  return {
    handleErrorEvent,
    maybeAddSuppressedToolErrorNote,
    maybeAddLowVerbosityFailureNote,
    suppressedToolErrorCountRef,
    suppressedToolErrorNoteShownRef,
    lowVerbosityFailureNoteShownRef,
  };
}
