/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Text, Box } from 'ink';
import { theme } from '../../semantic-colors.js';
import type { TokenUsageData } from '../../types.js';

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}m`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return String(count);
}

interface TokenUsageMessageProps {
  usage: TokenUsageData;
}

export const TokenUsageMessage: React.FC<TokenUsageMessageProps> = ({
  usage,
}) => {
  const inputStr = formatTokenCount(usage.promptTokenCount);
  const outputStr = formatTokenCount(usage.candidatesTokenCount);
  const cached = usage.cachedContentTokenCount;
  const cacheStr = cached ? ` cached:${formatTokenCount(cached)}` : '';

  return (
    <Box marginLeft={2}>
      <Text dimColor color={theme.text.secondary}>
        {`↑${inputStr} ↓${outputStr}${cacheStr}`}
      </Text>
    </Box>
  );
};
