/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamingState } from '../types.js';
import { useTimer } from './useTimer.js';
import { usePhraseCycler } from './usePhraseCycler.js';
import { useState, useEffect, useRef } from 'react';
import {
  getDisplayString,
  type RetryAttemptPayload,
} from '@google/gemini-cli-core';

const LOW_VERBOSITY_RETRY_HINT_ATTEMPT_THRESHOLD = 2;

/**
 * Extracts a human-readable message from an error string that may be
 * a raw JSON API response (e.g. `{"error":{"code":429,"message":"..."}}`).
 */
/**
 * Extracts a human-readable message from an error string that may be
 * a raw JSON API response (e.g. `{"error":{"code":429,"message":"..."}}`).
 * Uses regex to avoid unsafe type assertions from JSON.parse.
 */
function extractErrorMessage(raw: string): string {
  const match = /"message"\s*:\s*"([^"]+)"/.exec(raw);
  if (match?.[1]) {
    return match[1];
  }
  return raw;
}

export interface UseLoadingIndicatorProps {
  streamingState: StreamingState;
  shouldShowFocusHint: boolean;
  retryStatus: RetryAttemptPayload | null;
  showTips?: boolean;
  showWit?: boolean;
  customWittyPhrases?: string[];
  errorVerbosity?: 'low' | 'full';
  maxLength?: number;
}

export const useLoadingIndicator = ({
  streamingState,
  shouldShowFocusHint,
  retryStatus,
  showTips = true,
  showWit = false,
  customWittyPhrases,
  errorVerbosity = 'full',
  maxLength,
}: UseLoadingIndicatorProps) => {
  const [timerResetKey, setTimerResetKey] = useState(0);
  const isTimerActive = streamingState === StreamingState.Responding;

  const elapsedTimeFromTimer = useTimer(isTimerActive, timerResetKey);

  const isPhraseCyclingActive = streamingState === StreamingState.Responding;
  const isWaiting = streamingState === StreamingState.WaitingForConfirmation;

  const { currentTip, currentWittyPhrase } = usePhraseCycler(
    isPhraseCyclingActive,
    isWaiting,
    shouldShowFocusHint,
    showTips,
    showWit,
    customWittyPhrases,
    maxLength,
  );

  const [retainedElapsedTime, setRetainedElapsedTime] = useState(0);
  const prevStreamingStateRef = useRef<StreamingState | null>(null);

  useEffect(() => {
    if (
      prevStreamingStateRef.current === StreamingState.WaitingForConfirmation &&
      streamingState === StreamingState.Responding
    ) {
      setTimerResetKey((prevKey) => prevKey + 1);
      setRetainedElapsedTime(0); // Clear retained time when going back to responding
    } else if (
      streamingState === StreamingState.Idle &&
      prevStreamingStateRef.current === StreamingState.Responding
    ) {
      setTimerResetKey((prevKey) => prevKey + 1); // Reset timer when becoming idle from responding
      setRetainedElapsedTime(0);
    } else if (streamingState === StreamingState.WaitingForConfirmation) {
      // Capture the time when entering WaitingForConfirmation
      // elapsedTimeFromTimer will hold the last value from when isTimerActive was true.
      setRetainedElapsedTime(elapsedTimeFromTimer);
    }

    prevStreamingStateRef.current = streamingState;
  }, [streamingState, elapsedTimeFromTimer]);

  const retryErrorMessage = retryStatus?.error
    ? extractErrorMessage(retryStatus.error)
    : null;

  const retryPhrase =
    streamingState === StreamingState.Responding && retryStatus
      ? errorVerbosity === 'low'
        ? retryStatus.attempt >= LOW_VERBOSITY_RETRY_HINT_ATTEMPT_THRESHOLD
          ? retryErrorMessage
            ? `${retryErrorMessage} — retrying...`
            : "This is taking a bit longer, we're still on it."
          : null
        : retryErrorMessage
          ? `${retryErrorMessage} — retrying ${getDisplayString(retryStatus.model)} (Attempt ${retryStatus.attempt + 1}/${retryStatus.maxAttempts})`
          : `Trying to reach ${getDisplayString(retryStatus.model)} (Attempt ${retryStatus.attempt + 1}/${retryStatus.maxAttempts})`
      : null;

  return {
    elapsedTime:
      streamingState === StreamingState.WaitingForConfirmation
        ? retainedElapsedTime
        : elapsedTimeFromTimer,
    currentLoadingPhrase: retryPhrase || currentTip || currentWittyPhrase,
    retryPhrase: retryPhrase ?? undefined,
    currentTip,
    currentWittyPhrase,
  };
};
