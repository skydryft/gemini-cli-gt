/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Buffers streaming tokens and flushes at a fixed interval (~30fps),
 * reducing React state update frequency from ~100+/sec to ~30/sec.
 *
 * The existing text-buffer.ts is the input text editor buffer (cursor
 * movement, vim bindings). This hook is specifically for buffering
 * streaming output tokens before they trigger React state updates.
 */
export function useTokenBuffer(
  onFlush: (bufferedText: string) => void,
  flushIntervalMs = 32,
) {
  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFlushRef = useRef(onFlush);

  // Keep onFlush ref current without re-creating callbacks
  useEffect(() => {
    onFlushRef.current = onFlush;
  }, [onFlush]);

  const appendToken = useCallback(
    (token: string) => {
      bufferRef.current += token;
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (bufferRef.current) {
            const text = bufferRef.current;
            bufferRef.current = '';
            onFlushRef.current(text);
          }
        }, flushIntervalMs);
      }
    },
    [flushIntervalMs],
  );

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (bufferRef.current) {
      const text = bufferRef.current;
      bufferRef.current = '';
      onFlushRef.current(text);
    }
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [],
  );

  return { appendToken, flush };
}
